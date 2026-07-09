import type { WorkflowNodeDef, WorkflowRunState } from '../workflow/workflow.types';
export type RewindWorkflowForRetryResult = {
    workflowRun: WorkflowRunState;
    retryNodeId: string | null;
    clearedOutputKeys: string[];
};
export declare function rewindWorkflowForDraftRetry(input: {
    workflowRun: WorkflowRunState;
    workflowNodeDefs: WorkflowNodeDef[];
    nodeOutputs: Record<string, unknown>;
}): RewindWorkflowForRetryResult;
export declare function stripNodeOutputsForRetry(nodeOutputs: Record<string, unknown>, clearedKeys: string[]): Record<string, unknown>;
