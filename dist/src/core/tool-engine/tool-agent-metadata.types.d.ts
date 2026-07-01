import type { ConfiguredToolDecisionRole } from './tool-decision-role.enum';
export declare const ToolMode: {
    readonly READ: "READ";
    readonly WRITE: "WRITE";
    readonly ADMIN: "ADMIN";
};
export type ToolMode = (typeof ToolMode)[keyof typeof ToolMode];
export declare const ResourceType: {
    readonly PRODUCT: "PRODUCT";
    readonly PRICE: "PRICE";
    readonly INVENTORY: "INVENTORY";
    readonly SEO: "SEO";
    readonly CATEGORY: "CATEGORY";
    readonly COLLECTION: "COLLECTION";
    readonly ORDER: "ORDER";
    readonly CUSTOMER: "CUSTOMER";
    readonly UNKNOWN: "UNKNOWN";
};
export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];
export declare const OperationType: {
    readonly DETAIL: "DETAIL";
    readonly LIST: "LIST";
    readonly SEARCH: "SEARCH";
    readonly STATS: "STATS";
    readonly CREATE: "CREATE";
    readonly UPDATE: "UPDATE";
    readonly DELETE: "DELETE";
    readonly IMPORT: "IMPORT";
    readonly EXPORT: "EXPORT";
    readonly PUBLISH: "PUBLISH";
    readonly UNPUBLISH: "UNPUBLISH";
};
export type OperationType = (typeof OperationType)[keyof typeof OperationType];
export declare const TOOL_MODES: ("ADMIN" | "READ" | "WRITE")[];
export declare const RESOURCE_TYPES: ("COLLECTION" | "PRICE" | "INVENTORY" | "PRODUCT" | "SEO" | "CATEGORY" | "ORDER" | "CUSTOMER" | "UNKNOWN")[];
export declare const OPERATION_TYPES: ("DELETE" | "LIST" | "SEARCH" | "STATS" | "IMPORT" | "EXPORT" | "CREATE" | "UPDATE" | "PUBLISH" | "UNPUBLISH" | "DETAIL")[];
export type ParamFormatHint = {
    param: string;
    hint: string;
    example?: string;
};
export type AgentMetadata = {
    mode: ToolMode;
    resource: ResourceType;
    operation: OperationType;
    businessFields: string[];
    aliases: string[];
    examples: string[];
    priority: number;
    isMutation: boolean;
    paramFormatHints?: ParamFormatHint[];
};
export type ParsedUserToolIntent = {
    mode?: ToolMode;
    resource?: ResourceType;
    operation?: OperationType;
};
export type ToolMetadataSource = {
    agentMetadata?: unknown;
    responseProfile?: unknown;
    method?: string;
    name?: string;
    description?: string;
};
export type { ConfiguredToolDecisionRole };
