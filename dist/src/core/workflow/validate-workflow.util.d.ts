import type { WorkflowBindingRefs, WorkflowDefinition, WorkflowEdge, WorkflowNodeDef, WorkflowValidationIssue } from './workflow.types';
export declare function validateWorkflowDefinition(input: {
    definition: WorkflowDefinition;
    bindings?: WorkflowBindingRefs;
}): WorkflowValidationIssue[];
export declare function isValidWorkflowDefinition(input: {
    definition: WorkflowDefinition;
    bindings?: WorkflowBindingRefs;
}): boolean;
export declare function validateWorkflowTopology(input: {
    nodes: WorkflowNodeDef[];
    edges: WorkflowEdge[];
    entryNodeId?: string | null;
}): WorkflowValidationIssue[];
