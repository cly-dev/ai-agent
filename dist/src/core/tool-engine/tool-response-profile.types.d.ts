import type { ConfiguredToolDecisionRole, ToolDecisionRole } from './tool-decision-role.enum';
export type { ConfiguredToolDecisionRole, ToolDecisionRole };
export { CONFIGURED_TOOL_DECISION_ROLES, parseConfiguredToolDecisionRole, ToolDecisionRoleEnum, TOOL_DECISION_ROLE_META, TOOL_DECISION_ROLES, inferDecisionRoleFromHttpMethod, buildSwaggerImportResponseProfile, } from './tool-decision-role.enum';
export type ToolResponseFieldSpec = {
    path: string;
    label: string;
    description?: string;
    keywords?: string[];
    enumLabels?: Record<string, string>;
};
export type ToolResponseProfile = {
    coreFields: ToolResponseFieldSpec[];
    optionalFields?: ToolResponseFieldSpec[];
    arrayLimits?: Record<string, number>;
    listPath?: string;
    listMetaFields?: ToolResponseFieldSpec[];
    decisionRole?: ToolDecisionRole;
    entityType?: string;
};
export type ProjectedToolOutput = {
    data: unknown;
    fieldLabels: Record<string, string>;
    fieldDescriptions: Record<string, string>;
    enumLabelsByPath: Record<string, Record<string, string>>;
};
