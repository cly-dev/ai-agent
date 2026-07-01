export type RuntimeCacheLayer = 'L0' | 'L1' | 'L2' | 'L3';
export type RuntimeCacheLogInput = {
    layer: RuntimeCacheLayer;
    operation: string;
    cacheHit: boolean;
    revisionMismatch?: boolean;
    sessionId?: string;
    agentId?: number;
    appClientId?: number;
    runId?: number;
    extra?: Record<string, unknown>;
};
export declare function logRuntimeCacheEvent(input: RuntimeCacheLogInput): void;
