/// <reference types="node" />
import type { WorkflowNodeDef } from './workflow.types';
export declare function isWorkflowTriggerPermissionEnabled(env?: NodeJS.ProcessEnv): boolean;
export declare function extractWorkflowWriteToolIds(nodes: WorkflowNodeDef[]): number[];
export type WorkflowTriggerPermissionDecision = {
    allowed: boolean;
    missingToolIds: number[];
    skipped: boolean;
};
export declare function evaluateWorkflowTriggerPermission(input: {
    writeToolIds: number[];
    allowedToolIds: Iterable<number>;
    enabled?: boolean;
}): WorkflowTriggerPermissionDecision;
export declare function evaluateWorkflowTriggerPermissionForNodes(input: {
    nodes: WorkflowNodeDef[];
    allowedToolIds: Iterable<number>;
    enabled?: boolean;
}): WorkflowTriggerPermissionDecision;
