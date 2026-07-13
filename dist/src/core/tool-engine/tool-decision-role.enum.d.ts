export type ToolDecisionRole = 'read-detail' | 'read-list' | 'read-stats' | 'write-batch' | 'write-single' | 'write-meta' | 'admin' | 'unknown';
export type ConfiguredToolDecisionRole = Exclude<ToolDecisionRole, 'unknown'>;
export declare const ToolDecisionRoleEnum: {
    readonly ReadDetail: "read-detail";
    readonly ReadList: "read-list";
    readonly ReadStats: "read-stats";
    readonly WriteBatch: "write-batch";
    readonly WriteSingle: "write-single";
    readonly WriteMeta: "write-meta";
    readonly Admin: "admin";
};
export declare const CONFIGURED_TOOL_DECISION_ROLES: readonly ConfiguredToolDecisionRole[];
export declare const TOOL_DECISION_ROLES: readonly ToolDecisionRole[];
export declare const TOOL_DECISION_ROLE_META: ReadonlyArray<{
    value: ConfiguredToolDecisionRole;
    label: string;
    description: string;
    defaultHttpMethods: readonly string[];
}>;
export declare function parseConfiguredToolDecisionRole(value: unknown): ConfiguredToolDecisionRole | undefined;
export declare function deriveDecisionRoleFromAgentMetadata(meta: {
    mode: string;
    resource?: string;
    operation: string;
} | null | undefined): ConfiguredToolDecisionRole | undefined;
export declare function inferDecisionRoleFromHttpMethod(method: string): ConfiguredToolDecisionRole | undefined;
export declare function buildSwaggerImportResponseProfile(method: string, agentMetadata?: {
    mode: string;
    resource?: string;
    operation: string;
} | null): {
    decisionRole: ConfiguredToolDecisionRole;
    coreFields: Array<{
        path: string;
        label: string;
        description: string;
    }>;
};
