import { pendingRespondFromObservation } from '../../agent-engine/engine/turn/turn-respond.util';
import { ensureWorkflowNodeStarted } from '../workflow-plan-sync.util';
import { buildPlanSummarizeObservation } from '../../agent-engine/engine/main/plan/task-plan.util';
import { requireChatExecutorHost } from './executor-host.util';
import { projectedTaskPlanForExecutor } from './workflow-executor-plan.util';
import type { WorkflowExecutor } from './workflow-executor.types';

export const summarizeActionExecutor: WorkflowExecutor = {
  action: 'summarize',
  async run(ctx) {
    const chat = requireChatExecutorHost(ctx.host);
    const workflowRun = ensureWorkflowNodeStarted(ctx.workflowRun, ctx.nodeId);
    const taskPlan = projectedTaskPlanForExecutor(ctx);

    const summarizeObservation =
      chat.bundle.summarize.buildSummarizeObservationFromState(
        { ...chat.state, taskPlan } as typeof chat.state,
        { taskPlan, scopedTools: chat.state.scopedTools, workflowNodeDefs: chat.state.workflowNodeDefs },
      );

    return {
      kind: 'pending_summarize',
      workflowRun,
      pendingRespond: pendingRespondFromObservation(
        buildPlanSummarizeObservation({
          userMessage: chat.bundle.ctx.input.latestUserMessage,
          summarizeObservation,
        }),
      ),
    };
  },
};
