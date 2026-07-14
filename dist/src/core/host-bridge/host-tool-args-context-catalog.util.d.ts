export declare function isHostToolCatalogEnumInjectEnabled(): boolean;
export declare function resolveHostToolArgsSchemaForToolCallBind(argsSchema: Record<string, unknown>, context: Record<string, unknown> | null | undefined): {
    schema: Record<string, unknown>;
    catalogEnumInjected: boolean;
};
export declare function collectContextIdCatalog(context: Record<string, unknown> | null | undefined, catalogPath: string): Set<string>;
export declare function enrichHostToolArgsSchemaWithContextCatalogs(argsSchema: Record<string, unknown>, context: Record<string, unknown> | null | undefined): Record<string, unknown>;
export type SanitizeHostToolArgsCatalogResult = {
    args: Record<string, unknown>;
    droppedByField: Record<string, string[]>;
};
export declare function sanitizeHostToolArgsAgainstContextCatalogs(args: Record<string, unknown>, argsSchema: Record<string, unknown>, context: Record<string, unknown> | null | undefined): SanitizeHostToolArgsCatalogResult;
