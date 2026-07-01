import type { AgentGraphNodeBundle, AgentGraphNodeFn } from '../types/graph.types';
import { AgentRunStatus } from '../../../../../../../generated/prisma/client';
import { nextRunStepNumber } from '../../run/agent-run-steps.util';
import {
  advanceWorkflowRun,
  finalizeWorkflowRun,
} from '../../../../../workflow/workflow-run.util';
import { getCurrentWorkflowNode } from '../../../../../workflow/workflow-graph-routing.util';
import { projectTaskPlanFromWorkflowRun } from '../../../../../workflow/workflow-plan-sync.util';
import { logWorkflowDebug } from '../../../../../workflow/trace/workflow-debug.util';

export function createWorkflowAdvanceNode(
  bundle: AgentGraphNodeBundle,
): AgentGraphNodeFn {
  const { deps, ctx, runHelpers } = bundle;
  return async (state) => {
    const run = state.workflowRun;
    if (!run) {
      return state;
    }

    const current = getCurrentWorkflowNode(state);
    const completedNodeId = current?.nodeId;
    let workflowRun = advanceWorkflowRun(run);
    if (workflowRun.currentNodeId == null && workflowRun.status === 'running') {
      workflowRun = finalizeWorkflowRun(workflowRun, 'completed');
      deps.sse.emitThink(
        ctx.input.sessionId,
        ctx.input.runId,
        'Workflow 步骤已全部完成。\n',
        'delta',
      );
    }

    const advancedNode = workflowRun.currentNodeId
      ? workflowRun.nodes.find((row) => row.nodeId === workflowRun.currentNodeId)
      : null;
    const stepNum = nextRunStepNumber(state.steps);
    const advanceStep: typeof state.steps[number] = {
      step: stepNum,
      type: 'workflow',
      name: current?.nodeId ?? 'workflow',
      output: runHelpers.normalizeJsonLike({
        nodeId: current?.nodeId ?? null,
        action: current?.action ?? null,
        priorStatus: current?.status ?? null,
        event: 'node_advanced',
        nextNodeId: workflowRun.currentNodeId,
        nextAction: advancedNode?.action ?? null,
        workflowStatus: workflowRun.status,
      }),
    };

    const steps = [...state.steps, advanceStep];
    await runHelpers.updateRun(ctx.input.runId, steps, AgentRunStatus.running);

    logWorkflowDebug('workflow_advance', {
      runId: ctx.input.runId,
      sessionId: ctx.input.sessionId,
      turnId: ctx.input.turnId,
      nodeId: current?.nodeId ?? null,
      action: current?.action ?? null,
      priorStatus: current?.status ?? null,
      workflowRun,
      finalized: workflowRun.status === 'completed',
    });

    const taskPlan =
      projectTaskPlanFromWorkflowRun({
        taskPlan: state.taskPlan,
        workflowRun,
        workflowNodeDefs: state.workflowNodeDefs,
      }) ?? state.taskPlan;

    return {
      ...state,
      steps,
      workflowRun,
      taskPlan,
      workflowAwaitingReact: false,
    };
  };
}
