import type { AgentGraphNodeBundle, AgentGraphNodeFn } from '../types/graph.types';
import { AgentRunStatus } from '../../../../../../../generated/prisma/client';
import { shouldRouteToRespond } from '../../../turn/turn-graph.util';
import { shouldRouteGraphToTools } from '../../../gather/paged-list-gather.util';
import {
  planObservationBucketsFromState,
  selectObservationsForPagedGatherResume,
} from '../../plan/plan-observation-scope.util';
import {
  getCurrentWorkflowNode,
  resolveWorkflowNodeDefForExecute,
  routeAfterWorkflowReact,
} from '../../../../../workflow/workflow-graph-routing.util';
import { harnessSensorsForWorkflowAction } from '../../../../../harness/sensors';
import { DEGRADE_POLICY } from '../../../../../harness/policies/degrade.policy';
import { HarnessRunner } from '../../../../../harness/harness-runner';
import { harnessTraceToAgentStepOutput } from '../../../../../harness/trace/harness-trace.util';
import { buildHarnessSensorPayload } from '../../../../../workflow/workflow-harness.util';
import { failWorkflowNode } from '../../../../../workflow/workflow-run.util';
import { logWorkflowDebug } from '../../../../../workflow/trace/workflow-debug.util';
import { nextRunStepNumber } from '../../run/agent-run-steps.util';
import { maybeTagWorkflowReactInternalStep } from '../../run/agent-run-audit.util';
import { getPendingPlanToolStep } from '../../plan/task-plan.util';
import {
  buildGatherPipelineAudit,
  pendingClarificationFromRespond,
} from '../../../turn/gather-pipeline-audit.util';
import { createReadinessNode } from './readiness.node';
import { createToolResolveNode } from './tool-resolve.node';
import { createLlmNode } from './llm.node';
import { createParamGateNode } from './param-gate.node';
import { createToolsNode } from './tools.node';
import { createResultCheckNode } from './result-check.node';

/**
 * V2：将 readiness → tool_resolve → llm → param_gate ⇄ tools → resultCheck 内聚为单图节点，
 * 避免 workflow 轴下顶层 ReAct 环参与业务步进。
 */
export function createWorkflowReactNode(
  bundle: AgentGraphNodeBundle,
): AgentGraphNodeFn {
  const { deps, ctx, runHelpers } = bundle;
  const readiness = createReadinessNode(bundle);
  const toolResolve = createToolResolveNode(bundle);
  const llm = createLlmNode(bundle);
  const paramGate = createParamGateNode(bundle);
  const tools = createToolsNode(bundle);
  const resultCheck = createResultCheckNode(bundle);

  return async (state) => {
    if (!state.workflowAwaitingReact || state.finished) {
      return state;
    }

    const maxSteps = ctx.input.maxSteps;
    let current = state;
    let guard = 0;

    while (
      current.workflowAwaitingReact &&
      !current.finished &&
      guard < maxSteps
    ) {
      guard += 1;

      if (shouldRouteToRespond(current)) {
        break;
      }

      current = await readiness(current);
      if (current.finished || shouldRouteToRespond(current)) {
        break;
      }

      current = await toolResolve(current);
      if (current.finished || shouldRouteToRespond(current)) {
        break;
      }

      current = await llm(current);
      if (current.finished || shouldRouteToRespond(current)) {
        break;
      }

      current = await paramGate(current);
      if (current.finished || shouldRouteToRespond(current)) {
        break;
      }

      current = await resultCheck(current);
      if (current.finished || shouldRouteToRespond(current)) {
        break;
      }

      if (!current.workflowAwaitingReact) {
        break;
      }

      if (
        shouldRouteGraphToTools({
          pendingToolCalls: current.pendingToolCalls,
          taskPlan: current.taskPlan,
          scopedTools: current.scopedTools,
          observations: selectObservationsForPagedGatherResume(
            planObservationBucketsFromState(current),
          ),
        })
      ) {
        current = await tools(current);
        if (current.finished) {
          break;
        }
        current = await resultCheck(current);
        if (current.finished || shouldRouteToRespond(current)) {
          break;
        }
        if (!current.workflowAwaitingReact) {
          break;
        }
      }
    }

    const nodeId = current.workflowRun?.currentNodeId;
    const currentNode = getCurrentWorkflowNode(current);
    const def =
      nodeId != null
        ? resolveWorkflowNodeDefForExecute({
            nodeId,
            defs: current.workflowNodeDefs,
            ir: current.workflowIr,
            executionMode: current.workflowExecutionMode,
            phase: currentNode?.phase,
          })
        : undefined;
    if (
      nodeId &&
      def &&
      currentNode &&
      (currentNode.status === 'succeeded' || !current.workflowAwaitingReact)
    ) {
      const sensors = harnessSensorsForWorkflowAction(def.action);
      if (sensors.length > 0 && current.workflowRun) {
        const harness = new HarnessRunner({
          sensors,
          policy: DEGRADE_POLICY,
        });
        const sensorResult = await harness.runAfterNodeSensors({
          ctx: { nodeId, action: def.action, profile: 'chat' },
          payload: buildHarnessSensorPayload(def, current),
        });
        if (sensorResult.trace.length > 0) {
          const stepNum = nextRunStepNumber(current.steps);
          const harnessStep: (typeof current.steps)[number] = {
            step: stepNum,
            type: 'workflow',
            name: `${nodeId}:harness`,
            output: runHelpers.normalizeJsonLike(
              harnessTraceToAgentStepOutput(sensorResult.trace),
            ),
          };
          current = { ...current, steps: [...current.steps, harnessStep] };
        }
        if (sensorResult.sensorFailed && current.workflowRun) {
          const failedRun = failWorkflowNode(
            current.workflowRun,
            nodeId,
            {
              code: sensorResult.sensorFailed.code ?? 'HARNESS_SENSOR_FAIL',
              message:
                sensorResult.sensorFailed.message ?? 'Harness sensor failed',
            },
          );
          logWorkflowDebug('workflow_react_harness_fail', {
            runId: ctx.input.runId,
            sessionId: ctx.input.sessionId,
            turnId: ctx.input.turnId,
            nodeId,
            action: def.action,
            sensor: sensorResult.sensorFailed,
            workflowRun: failedRun,
          });
          current = {
            ...current,
            workflowRun: failedRun,
            workflowAwaitingReact: false,
            finished: true,
          };
        }
      }
    }

    if (guard >= maxSteps && current.workflowAwaitingReact) {
      deps.logger.warn(
        `workflow_react hit maxSteps runId=${ctx.input.runId} nodeId=${nodeId ?? 'unknown'}`,
      );
      logWorkflowDebug('workflow_react_max_steps', {
        runId: ctx.input.runId,
        sessionId: ctx.input.sessionId,
        turnId: ctx.input.turnId,
        nodeId: nodeId ?? null,
        guard,
        maxSteps,
        workflowRun: current.workflowRun,
      });
      if (nodeId && current.workflowRun) {
        const failedRun = failWorkflowNode(current.workflowRun, nodeId, {
          code: 'WORKFLOW_REACT_MAX_STEPS',
          message: `Workflow ReAct loop exceeded maxSteps (${maxSteps})`,
        });
        current = {
          ...current,
          workflowRun: failedRun,
          workflowAwaitingReact: false,
          finished: true,
        };
      }
    }

    logWorkflowDebug('workflow_react_exit', {
      runId: ctx.input.runId,
      sessionId: ctx.input.sessionId,
      turnId: ctx.input.turnId,
      nodeId: nodeId ?? null,
      workflowAwaitingReact: current.workflowAwaitingReact === true,
      finished: current.finished,
      workflowRun: current.workflowRun,
      route: routeAfterWorkflowReact(current),
    });

    const hadGatherPipeline = current.steps.some(
      (step) =>
        step.type === 'tool_resolve' ||
        step.type === 'llm' ||
        step.type === 'param_gate',
    );
    if (hadGatherPipeline) {
      const pendingStep = getPendingPlanToolStep(
        current.taskPlan,
        current.workflowRun,
      );
      const audit = buildGatherPipelineAudit({
        steps: current.steps,
        planStepId:
          pendingStep?.id ??
          current.taskPlan?.currentStepId ??
          null,
        pendingClarification: pendingClarificationFromRespond(
          current.pendingRespond,
        ),
      });
      if (audit.invariantViolations.length > 0) {
        deps.logger.warn(
          `gather_pipeline invariant violations runId=${ctx.input.runId} violations=${audit.invariantViolations.join(',')}`,
        );
      }
      const auditStepNum = nextRunStepNumber(current.steps);
      const auditStep = maybeTagWorkflowReactInternalStep(
        {
          step: auditStepNum,
          type: 'gather_pipeline',
          output: runHelpers.normalizeJsonLike(audit),
        },
        current,
      );
      const stepsWithAudit = [...current.steps, auditStep];
      await runHelpers.updateRun(
        ctx.input.runId,
        stepsWithAudit,
        AgentRunStatus.running,
      );
      current = { ...current, steps: stepsWithAudit };
    }

    return current;
  };
}

export function resolveWorkflowReactRoute(
  state: Parameters<typeof routeAfterWorkflowReact>[0],
): string {
  return routeAfterWorkflowReact(state);
}
