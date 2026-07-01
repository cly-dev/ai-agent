import type { WorkflowNodeDef, WorkflowValidationIssue } from './workflow.types';
export declare function validatePageActionWorkflowBinding(input: {
    pageActionHostToolId: number;
    nodes: WorkflowNodeDef[];
}): WorkflowValidationIssue[];
