import type { WorkflowExecutor, WorkflowExecutorContext } from './workflow-executor.types';

function delegateReact(ctx: WorkflowExecutorContext) {
  return {
    kind: 'delegate_react' as const,
    workflowRun: ctx.workflowRun,
    workflowAwaitingReact: true as const,
  };
}

export const composeMutationExecutor: WorkflowExecutor = {
  action: 'compose_mutation',
  async run(ctx) {
    return delegateReact(ctx);
  },
};

export const writeDataExecutor: WorkflowExecutor = {
  action: 'write_data',
  async run(ctx) {
    return delegateReact(ctx);
  },
};

export const awaitUserConfirmExecutor: WorkflowExecutor = {
  action: 'await_user_confirm',
  async run(ctx) {
    return {
      kind: 'awaiting_user_confirm',
      workflowRun: ctx.workflowRun,
    };
  },
};
