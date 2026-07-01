import type { WorkflowActionKind, WorkflowProfile } from './workflow.types';
export type WorkflowActionRegistryEntry = {
    kind: WorkflowActionKind;
    implemented: boolean;
    allowedProfiles: readonly WorkflowProfile[];
    batch: 'A' | 'B';
};
export declare const WORKFLOW_ACTION_REGISTRY: readonly WorkflowActionRegistryEntry[];
export declare const WORKFLOW_ACTION_KINDS: readonly WorkflowActionKind[];
export declare function getWorkflowActionRegistryEntry(kind: string): WorkflowActionRegistryEntry | null;
export declare function isWorkflowActionKind(value: string): value is WorkflowActionKind;
export declare function workflowProfileAllowsAction(profile: WorkflowProfile, kind: WorkflowActionKind): boolean;
