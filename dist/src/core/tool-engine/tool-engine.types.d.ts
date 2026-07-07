import type { DynamicStructuredTool } from '@langchain/core/tools';
import type { HttpMethod, IntegrationAuthMode } from '../../../generated/prisma/client';
import type { ToolDefinitionInput } from './tool-schema.util';
export type { ToolDefinitionInput };
export type ToolIntegrationDefinition = {
    id: number;
    name: string;
    baseUrl: string;
    authMode: IntegrationAuthMode;
    apiKey: string | null;
};
export type ToolExecutionDefinition = ToolDefinitionInput & {
    method: HttpMethod;
    path: string;
    timeout: number | null;
    integration: ToolIntegrationDefinition;
    agentMetadata?: unknown;
    responseProfile?: unknown;
};
export type ToolBuildContext = {
    userId: number;
    allowedToolIds: number[];
    integrationCredentialCache?: ReadonlyMap<string, string>;
};
export type ToolHttpResponseSource = {
    ok: boolean;
    status: number;
    statusText: string;
    bodyText: string;
    bodyParsed: unknown;
};
export type ToolExecutionResult = {
    toolId: number;
    name: string;
    input: Record<string, unknown>;
    output: unknown;
    latency: number;
    responseSource?: unknown;
    httpResponse?: ToolHttpResponseSource;
};
export type ToolDebugResult = {
    ok: boolean;
    toolId: number;
    toolName: string;
    method: string;
    url: string;
    durationMs: number;
    request: {
        headers: Record<string, string>;
        body: string | null;
    };
    response?: {
        status: number;
        statusText: string;
        body: string;
        data: unknown;
    };
    error?: string;
};
export type ToolDebugOptions = {
    parameters?: Record<string, unknown>;
    headers?: Record<string, string>;
    apiKey?: string;
    timeoutMs?: number;
};
export type BuiltLangChainTools = {
    tools: DynamicStructuredTool[];
    byName: Map<string, DynamicStructuredTool>;
};
