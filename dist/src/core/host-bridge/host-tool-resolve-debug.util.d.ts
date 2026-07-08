export type HostToolResolveDebugRecord = {
    component: 'host_tool_resolve';
    stage: string;
    writtenAt: string;
} & Record<string, unknown>;
export declare function isHostToolResolveDebugEnabled(): boolean;
export declare function logHostToolResolve(stage: string, payload: Record<string, unknown>): string | null;
