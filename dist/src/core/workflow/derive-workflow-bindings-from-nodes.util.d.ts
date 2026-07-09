import type { WorkflowNodeDef } from './workflow.types';
export type WorkflowDerivedToolBinding = {
    toolId: number;
    isRequired: boolean;
};
export type WorkflowDerivedHostToolBinding = {
    hostToolId: number;
    isRequired: boolean;
};
export declare function collectWorkflowNodeBindingRefs(nodes: WorkflowNodeDef[]): {
    toolIds: number[];
    hostToolIds: number[];
};
export declare function deriveWorkflowBindingsFromNodes(nodes: WorkflowNodeDef[]): {
    tools: WorkflowDerivedToolBinding[];
    hostTools: WorkflowDerivedHostToolBinding[];
};
export type WorkflowExplicitToolBinding = {
    toolId: number;
    isRequired?: boolean;
};
export type WorkflowExplicitHostToolBinding = {
    hostToolId: number;
    isRequired?: boolean;
};
export type WorkflowBindingResolutionIssue = {
    path: string;
    code: string;
    message: string;
};
export declare function resolveWorkflowBindingsForSave(input: {
    nodes: WorkflowNodeDef[];
    explicitTools?: WorkflowExplicitToolBinding[];
    explicitHostTools?: WorkflowExplicitHostToolBinding[];
}): {
    tools: WorkflowDerivedToolBinding[];
    hostTools: WorkflowDerivedHostToolBinding[];
    issues: WorkflowBindingResolutionIssue[];
};
