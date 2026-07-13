import type { WorkflowBindingRefs, WorkflowDefinition, WorkflowValidationIssue } from './workflow.types';
export declare function validateWorkflowDefinition(input: {
    definition: WorkflowDefinition;
    bindings?: WorkflowBindingRefs;
}): WorkflowValidationIssue[];
export declare function isValidWorkflowDefinition(input: {
    definition: WorkflowDefinition;
    bindings?: WorkflowBindingRefs;
}): boolean;
