import type { WorkflowExecutor } from './workflow-executor.types';

export const fetchDataExecutor: WorkflowExecutor = {
  action: 'fetch_data',
  async run(ctx) {
    return {
      kind: 'delegate_react',
      workflowRun: ctx.workflowRun,
      workflowAwaitingReact: true,
    };
  },
};

export const generateAndPushExecutor: WorkflowExecutor = {
  action: 'generate_and_push',
  async run(ctx) {
    return {
      kind: 'delegate_react',
      workflowRun: ctx.workflowRun,
      workflowAwaitingReact: true,
    };
  },
};
