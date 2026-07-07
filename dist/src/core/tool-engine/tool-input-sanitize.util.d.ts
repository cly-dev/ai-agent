export type OpenApiParamSpec = {
    name: string;
    in: string;
    type?: string;
    itemsType?: string;
    collectionFormat?: string;
    default?: unknown;
};
export declare function collectOpenApiParameterSpecs(schema: unknown): OpenApiParamSpec[];
export declare function applyToolParameterDefaults(input: Record<string, unknown>, specs: OpenApiParamSpec[], options?: {
    agentMetadata?: unknown;
    responseProfile?: unknown;
}): Record<string, unknown>;
export declare function sanitizeToolInvokeInput(input: Record<string, unknown>, specs: OpenApiParamSpec[]): Record<string, unknown>;
export declare function formatQueryScalar(value: unknown): string;
