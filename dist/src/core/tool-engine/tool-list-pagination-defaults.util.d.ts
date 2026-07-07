type PaginationParamSpec = {
    name: string;
    in: string;
    type?: string;
    default?: unknown;
};
export declare function shouldApplyListPaginationDefaults(input: {
    agentMetadata: unknown;
    responseProfile?: unknown;
    specs: PaginationParamSpec[];
}): boolean;
export declare function applyListPaginationDefaults(input: Record<string, unknown>, specs: PaginationParamSpec[], options?: {
    agentMetadata?: unknown;
    responseProfile?: unknown;
}): Record<string, unknown>;
export {};
