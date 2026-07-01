import type { WorkflowExecutorOutcome } from '../workflow/executors/workflow-executor.types';
import type { WorkflowRunState } from '../workflow/workflow.types';

/** page workflow 节点执行后的编排动作（与 chat execute-node 对齐，不内联 if 补丁）。 */
export type PageWorkflowNodeDispatch =
  | {
      action: 'advance';
      workflowRun: WorkflowRunState;
      outcome: Extract<WorkflowExecutorOutcome, { kind: 'completed' }>;
    }
  | {
      action: 'react';
      workflowRun: WorkflowRunState;
      outcome: Extract<WorkflowExecutorOutcome, { kind: 'delegate_react' }>;
    }
  | {
      action: 'suspend';
      workflowRun: WorkflowRunState;
      outcome: Extract<WorkflowExecutorOutcome, { kind: 'awaiting_user_confirm' }>;
      nodeId: string;
    }
  | {
      action: 'fail';
      workflowRun: WorkflowRunState;
      errorCode: string;
      errorMessage?: string;
    };

export function dispatchPageWorkflowNodeOutcome(input: {
  nodeId: string;
  rawOutcome: WorkflowExecutorOutcome;
}): PageWorkflowNodeDispatch {
  const { rawOutcome } = input;

  if (rawOutcome.kind === 'failed') {
    return {
      action: 'fail',
      workflowRun: rawOutcome.workflowRun,
      errorCode: rawOutcome.error.code,
      errorMessage: rawOutcome.error.message,
    };
  }

  if (rawOutcome.kind === 'awaiting_user_confirm') {
    return {
      action: 'suspend',
      workflowRun: rawOutcome.workflowRun,
      outcome: rawOutcome,
      nodeId: input.nodeId,
    };
  }

  if (rawOutcome.kind === 'delegate_react') {
    return {
      action: 'react',
      workflowRun: rawOutcome.workflowRun,
      outcome: rawOutcome,
    };
  }

  if (rawOutcome.kind === 'pending_summarize') {
    return {
      action: 'fail',
      workflowRun: rawOutcome.workflowRun,
      errorCode: 'pending_summarize_not_supported_on_page',
      errorMessage:
        'present_mutation pending_summarize is not supported on page workflow; use summarize action',
    };
  }

  return {
    action: 'advance',
    workflowRun: rawOutcome.workflowRun,
    outcome: rawOutcome,
  };
}
