import type { WorkflowNodeDef, WorkflowValidationIssue } from './workflow.types';
export type WorkflowScopeContext = {
    allowedToolIds: number[];
    allowedHostToolIds: number[];
    allowedDefinitionKeys?: string[];
};
export declare function validateWorkflowAgainstScope(input: {
    nodes: WorkflowNodeDef[];
    scope: WorkflowScopeContext;
}): WorkflowValidationIssue[];
export declare function isWorkflowCompatibleWithScope(input: {
    nodes: WorkflowNodeDef[];
    scope: WorkflowScopeContext;
}): boolean;
