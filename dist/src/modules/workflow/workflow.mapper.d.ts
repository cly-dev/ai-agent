import type { WorkflowDetailRow, WorkflowListRow, WorkflowListItem, WorkflowResponse, WorkflowRevisionResponse } from './workflow.types';
export declare function toWorkflowResponse(row: WorkflowDetailRow): WorkflowResponse;
export declare function toWorkflowListItem(row: WorkflowListRow): WorkflowListItem;
export declare function toWorkflowRevisionResponse(row: {
    id: number;
    workflowId: number;
    version: number;
    deliverable: string;
    nodes: unknown;
    constraints: unknown;
    changeNote: string | null;
    createdAt: Date;
}): WorkflowRevisionResponse;
