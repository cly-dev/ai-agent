import { ensureWorkflowNodeStarted } from '../../workflow-plan-sync.util';
import { requirePageExecutorHost } from '../executor-host.util';
import type { WorkflowExecutor } from '../workflow-executor.types';

export const pageAwaitUserConfirmExecutor: WorkflowExecutor = {
  action: 'await_user_confirm',
  async run(ctx) {
    requirePageExecutorHost(ctx.host);
    return {
      kind: 'awaiting_user_confirm',
      workflowRun: ensureWorkflowNodeStarted(ctx.workflowRun, ctx.nodeId),
    };
  },
};
