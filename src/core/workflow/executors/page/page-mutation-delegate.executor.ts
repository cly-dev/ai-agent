import type { WorkflowExecutor, WorkflowExecutorContext } from '../workflow-executor.types';

function delegateReact(ctx: WorkflowExecutorContext) {
  return {
    kind: 'delegate_react' as const,
    workflowRun: ctx.workflowRun,
    workflowAwaitingReact: true as const,
  };
}

export const pageComposeMutationExecutor: WorkflowExecutor = {
  action: 'compose_mutation',
  async run(ctx) {
    return delegateReact(ctx);
  },
};

export const pageWriteDataExecutor: WorkflowExecutor = {
  action: 'write_data',
  async run(ctx) {
    return delegateReact(ctx);
  },
};
