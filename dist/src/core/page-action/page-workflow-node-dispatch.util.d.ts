import type { WorkflowExecutorOutcome } from '../workflow/executors/workflow-executor.types';
import type { WorkflowRunState } from '../workflow/workflow.types';
export type PageWorkflowNodeDispatch = {
    action: 'advance';
    workflowRun: WorkflowRunState;
    outcome: Extract<WorkflowExecutorOutcome, {
        kind: 'completed';
    }>;
} | {
    action: 'react';
    workflowRun: WorkflowRunState;
    outcome: Extract<WorkflowExecutorOutcome, {
        kind: 'delegate_react';
    }>;
} | {
    action: 'suspend';
    workflowRun: WorkflowRunState;
    outcome: Extract<WorkflowExecutorOutcome, {
        kind: 'awaiting_user_confirm';
    }>;
    nodeId: string;
} | {
    action: 'fail';
    workflowRun: WorkflowRunState;
    errorCode: string;
    errorMessage?: string;
};
export declare function dispatchPageWorkflowNodeOutcome(input: {
    nodeId: string;
    rawOutcome: WorkflowExecutorOutcome;
}): PageWorkflowNodeDispatch;
