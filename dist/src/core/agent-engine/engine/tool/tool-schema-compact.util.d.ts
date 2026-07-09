import type { ParamFormatHint } from '../../../tool-engine/tool-agent-metadata.types';
import type { ToolDecisionRole } from '../../../tool-engine/tool-decision-role.enum';
export type ToolSchemaCompact = {
    name: string;
    description?: string;
    role: ToolDecisionRole;
    resource?: string;
    operation?: string;
    filters?: string[];
    returns?: string[];
    businessFields?: string[];
    isMutation?: boolean;
    requiredParams?: string[];
    paramHints?: ParamFormatHint[];
};
export declare function summarizeToolsForLlmSchema(tools: Array<{
    name: string;
    description: string;
    inputSchema: unknown;
    schema?: unknown;
    agentMetadata: unknown;
    responseProfile: unknown;
    method?: string;
}>): ToolSchemaCompact[];
