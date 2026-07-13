import type { WorkflowNodeDef } from './workflow.types';
export declare function resolveWorkflowPushHostToolId(nodes: WorkflowNodeDef[], preferredHostToolId?: number | null): number | null;
export declare function workflowNodeRefsRunnableForUser(input: {
    nodes: WorkflowNodeDef[];
    userAllowedToolIds: ReadonlySet<number>;
    userAllowedHostToolIds: ReadonlySet<number>;
}): boolean;
export declare function collectWorkflowScopedToolIds(nodes: WorkflowNodeDef[], userAllowedToolIds: ReadonlySet<number>): number[];
