import { type AgentMetadata, type ParamFormatHint } from './tool-agent-metadata.types';
export type ToolParamCompact = {
    name: string;
    required: boolean;
    in?: string;
    type?: string;
    format?: string;
    description?: string;
    enum?: string[];
    schemaRef?: string;
};
export type RequestBodyCompact = {
    required?: boolean;
    description?: string;
    schemaRef?: string;
    properties?: ToolParamCompact[];
};
export type CompactToolInput = {
    parameters: ToolParamCompact[];
    requestBody?: RequestBodyCompact | null;
    optionalParamNames?: string[];
};
export declare function describeJsonSchemaType(schema: Record<string, unknown>, visited?: WeakSet<Record<string, unknown>>): string;
export declare function compactParamToFormatHint(row: ToolParamCompact): ParamFormatHint | null;
export declare function listToolInputCompactParams(inputSchema: unknown, fallbackSchema: unknown): ToolParamCompact[];
export declare function resolveParamFormatHints(inputSchema: unknown, fallbackSchema: unknown, explicitHints?: ParamFormatHint[]): ParamFormatHint[];
export declare function syncAgentMetadataParamFormatHints(metadata: AgentMetadata, inputSchema: unknown, fallbackSchema?: unknown): AgentMetadata;
export declare function normalizeAgentMetadataForPersist(raw: unknown, inputSchema: unknown, fallbackSchema?: unknown): AgentMetadata | null;
export declare function applyParamFormatHintsToCompactInput(input: CompactToolInput, hints: ParamFormatHint[]): CompactToolInput;
export declare function buildCompactToolInput(inputSchema: unknown, fallbackSchema: unknown, agentMetadata: unknown): CompactToolInput;
export declare function listRequiredParamNames(input: CompactToolInput): string[];
