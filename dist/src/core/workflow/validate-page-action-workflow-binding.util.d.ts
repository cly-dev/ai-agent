import type { WorkflowNodeDef, WorkflowValidationIssue } from './workflow.types';
export declare function validatePageActionWorkflowBinding(_input: {
    pageActionHostToolId?: number | null;
    nodes: WorkflowNodeDef[];
}): WorkflowValidationIssue[];
