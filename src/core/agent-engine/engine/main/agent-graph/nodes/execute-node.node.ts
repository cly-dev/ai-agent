import type { AgentGraphNodeBundle, AgentGraphNodeFn } from '../types/graph.types';
import { AgentRunStatus } from '../../../../../../../generated/prisma/client';
import { createChatHarnessRunner } from '../../../../../harness/harness-runner';
import { harnessTraceToAgentStepOutput } from '../../../../../harness/trace/harness-trace.util';
import { resolveWorkflowNodeExecutor } from '../../../../../workflow/executors/resolve-workflow-node-executor.util';
import { chatExecutorContext } from '../../../../../workflow/executors/executor-host.util';
import { ensureWorkflowNodeStarted, applyWorkflowTaskPlanProjection, deriveWorkflowAwaitingReact } from '../../../../../workflow/workflow-plan-sync.util';
import { failWorkflowNode } from '../../../../../workflow/workflow-run.util';
import { resolveWorkflowNodeDefForExecute, getWorkflowNodeDef } from '../../../../../workflow/workflow-graph-routing.util';
import { mergeWorkflowExecutorOutcome } from '../../../../../workflow/workflow-summarize-sync.util';
import { applyWorkflowAwaitUserConfirmGate } from '../../../../../workflow/workflow-await-user-confirm-gate.util';
import { logWorkflowDebug } from '../../../../../workflow/trace/workflow-debug.util';
import { nextRunStepNumber } from '../../run/agent-run-steps.util';
import type { WorkflowNodeDef } from '../../../../../workflow/workflow.types';
import { resolveCurrentIrNodeId } from '../../../../../workflow/project-ir-run-status.util';

const chatHarness = createChatHarnessRunner();

function mergeExecutorGraphState(
  base: Parameters<AgentGraphNodeFn>[0],
  patch: Partial<Parameters<AgentGraphNodeFn>[0]>,
): Parameters<AgentGraphNodeFn>[0] {
  const merged = applyWorkflowTaskPlanProjection({ ...base, ...patch });
  const workflowAwaitingReact =
    patch.workflowAwaitingReact ??
    deriveWorkflowAwaitingReact({
      workflowRun: merged.workflowRun,
      workflowNodeDefs: merged.workflowNodeDefs,
    });
  return { ...merged, workflowAwaitingReact };
}

export function createExecuteNodeNode(
  bundle: AgentGraphNodeBundle,
): AgentGraphNodeFn {
  const { deps, ctx, runHelpers } = bundle;
  return async (state) => {
    const debugBase = {
      runId: ctx.input.runId,
      sessionId: ctx.input.sessionId,
      turnId: ctx.input.turnId,
    };
    const run = state.workflowRun;
    const nodeId = run?.currentNodeId;
    if (!run || !nodeId) {
      return state;
    }

    const def = resolveWorkflowNodeDefForExecute({
      nodeId,
      defs: state.workflowNodeDefs,
      ir: state.workflowIr,
      executionMode: state.workflowExecutionMode,
      phase: run.nodes.find((n) => n.nodeId === nodeId)?.phase,
    });
    if (!def) {
      return state;
    }

    const workflowRun = ensureWorkflowNodeStarted(run, nodeId);
    const stepNum = nextRunStepNumber(state.steps);
    const workflowStep: (typeof state.steps)[number] = {
      step: stepNum,
      type: 'workflow',
      name: nodeId,
      output: runHelpers.normalizeJsonLike({
        nodeId,
        action: def.action,
        irNodeId: def.irNodeId ?? null,
        irType: def.irType ?? null,
        executionMode: state.workflowExecutionMode ?? null,
        nodeStatus: 'running',
        event: 'node_start',
      }),
    };
    const stepsWithStart = [...state.steps, workflowStep];
    await runHelpers.updateRun(
      ctx.input.runId,
      stepsWithStart,
      AgentRunStatus.running,
    );

    deps.sse.emitThink(
      ctx.input.sessionId,
      ctx.input.runId,
      `正在执行：${def.name}…\n`,
      'delta',
    );

    const resolved = resolveWorkflowNodeExecutor(def, 'chat');
    const executor = resolved.executor;
    if (!executor) {
      const failedRun = failWorkflowNode(workflowRun, nodeId, {
        code: 'action_not_implemented',
        message: `Workflow action not implemented: ${resolved.action}`,
      });
      logWorkflowDebug('execute_node', {
        ...debugBase,
        nodeId,
        action: resolved.action,
        irType: resolved.irType,
        dispatchKind: resolved.dispatchKind,
        outcome: 'not_implemented',
        workflowRun: failedRun,
      });
      return {
        ...state,
        steps: stepsWithStart,
        workflowRun: failedRun,
        workflowAwaitingReact: false,
      };
    }

    logWorkflowDebug('execute_node_dispatch', {
      ...debugBase,
      nodeId,
      action: resolved.action,
      irType: resolved.irType,
      irNodeId: resolved.irNodeId,
      dispatchKind: resolved.dispatchKind,
      executionMode: state.workflowExecutionMode ?? null,
      currentIrNodeId: resolveCurrentIrNodeId(workflowRun),
    });
    const harnessResult = await chatHarness.runNode({
      ctx: {
        nodeId,
        action: resolved.action,
        profile: 'chat',
      },
      execute: () =>
        executor.run(
          chatExecutorContext({
            bundle,
            state: { ...state, workflowRun },
            def,
            nodeId,
            workflowRun,
          }),
        ),
    });

    const outcome = harnessResult.value;
    const harnessOutput = harnessTraceToAgentStepOutput(harnessResult.trace);
    const stepsWithHarness = [
      ...stepsWithStart,
      {
        step: stepNum + 1,
        type: 'workflow' as const,
        name: `${nodeId}:harness`,
        output: runHelpers.normalizeJsonLike(harnessOutput),
      },
    ];

    if (outcome.kind === 'failed') {
      logWorkflowDebug('execute_node', {
        ...debugBase,
        nodeId,
        action: resolved.action,
        irType: resolved.irType,
        dispatchKind: resolved.dispatchKind,
        outcome: 'failed',
        error: outcome.error,
        workflowRun: outcome.workflowRun,
        harnessTrace: harnessOutput,
      });
      return {
        ...state,
        steps: stepsWithHarness,
        workflowRun: outcome.workflowRun,
        workflowAwaitingReact: false,
      };
    }

    if (outcome.kind === 'completed') {
      logWorkflowDebug('execute_node', {
        ...debugBase,
        nodeId,
        action: resolved.action,
        irType: resolved.irType,
        dispatchKind: resolved.dispatchKind,
        outcome: 'completed',
        outputRef: outcome.outputRef ?? null,
        workflowRun: outcome.workflowRun,
      });
      return mergeWorkflowExecutorOutcome(
        mergeExecutorGraphState(
          { ...state, steps: stepsWithHarness },
          {
            workflowAwaitingReact: false,
            pendingRespond: null,
          },
        ),
        {
          workflowRun: outcome.workflowRun,
          outputRef: outcome.outputRef,
          nodeOutput: outcome.nodeOutput,
        },
      );
    }

    if (outcome.kind === 'pending_summarize') {
      logWorkflowDebug('execute_node', {
        ...debugBase,
        nodeId,
        action: resolved.action,
        irType: resolved.irType,
        dispatchKind: resolved.dispatchKind,
        outcome: 'pending_summarize',
        workflowRun: outcome.workflowRun,
      });
      return mergeExecutorGraphState(
        { ...state, steps: stepsWithHarness },
        {
          workflowRun: outcome.workflowRun,
          workflowAwaitingReact: false,
          pendingRespond: outcome.pendingRespond,
        },
      );
    }

    if (outcome.kind === 'awaiting_user_confirm') {
      logWorkflowDebug('execute_node', {
        ...debugBase,
        nodeId,
        action: resolved.action,
        irType: resolved.irType,
        dispatchKind: resolved.dispatchKind,
        outcome: 'awaiting_user_confirm',
        workflowRun: outcome.workflowRun,
      });
      const projected = mergeExecutorGraphState(state, {
        steps: stepsWithHarness,
        workflowRun: outcome.workflowRun,
      });
      if (!projected.taskPlan) {
        return projected;
      }
      return applyWorkflowAwaitUserConfirmGate(bundle, projected, {
        steps: stepsWithHarness,
        workflowRun: outcome.workflowRun,
        taskPlan: projected.taskPlan,
        nodeId,
      });
    }

    logWorkflowDebug('execute_node', {
      ...debugBase,
      nodeId,
      action: resolved.action,
      irType: resolved.irType,
      dispatchKind: resolved.dispatchKind,
      outcome: 'delegate_react',
      workflowAwaitingReact: outcome.workflowAwaitingReact,
      workflowRun: outcome.workflowRun,
    });
    return mergeExecutorGraphState(
      { ...state, steps: stepsWithHarness },
      {
        workflowRun: outcome.workflowRun,
        workflowAwaitingReact: outcome.workflowAwaitingReact,
        pendingRespond: null,
      },
    );
  };
}

export function resolveExecuteNodeDef(
  defs: WorkflowNodeDef[] | undefined,
  nodeId: string | null | undefined,
): WorkflowNodeDef | undefined {
  return getWorkflowNodeDef(defs, nodeId);
}
