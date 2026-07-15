import type { ParsedWorkflowGraph } from './graph/workflow-edge.util';
export declare function workflowLoadCacheKey(input: {
    appClientId: number;
    workflowId: number;
    workflowVersion?: number | null;
}): string;
export declare function readCachedWorkflowLoad(key: string, workflowUpdatedAt: Date, revisionFingerprint: string | null, resolvedVersion: number): ParsedWorkflowGraph | null;
export declare function rememberWorkflowLoadCache(key: string, entry: {
    workflowId: number;
    version: number;
    workflowUpdatedAt: string;
    revisionFingerprint: string | null;
    graph: ParsedWorkflowGraph;
}): void;
