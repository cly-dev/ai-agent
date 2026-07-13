import type { WorkflowNodeDef } from './workflow.types';
type WorkflowLoadCacheEntry = {
    expiresAt: number;
    workflowId: number;
    version: number;
    workflowUpdatedAt: string;
    revisionFingerprint: string | null;
    baseNodes: WorkflowNodeDef[];
};
export declare function workflowLoadCacheKey(input: {
    appClientId: number;
    workflowId: number;
    workflowVersion?: number | null;
}): string;
export declare function readCachedWorkflowLoad(key: string, workflowUpdatedAt: Date, revisionFingerprint: string | null, resolvedVersion: number): WorkflowNodeDef[] | null;
export declare function rememberWorkflowLoadCache(key: string, entry: Omit<WorkflowLoadCacheEntry, 'expiresAt'>): void;
export {};
