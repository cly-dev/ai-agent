import { type ToolDecisionRole } from './tool-decision-role.enum';
import type { ToolResponseProfile } from './tool-response-profile.types';
import { type AgentMetadata, type ParsedUserToolIntent, type ToolMetadataSource } from './tool-agent-metadata.types';
export declare function parseAgentMetadata(raw: unknown): AgentMetadata | null;
export declare function normalizeAgentMetadata(raw: unknown): AgentMetadata | null;
export declare function inferAgentMetadataFromOpenApi(input: {
    method: string;
    path: string;
    name: string;
    description: string;
    inputSchema?: unknown;
}): AgentMetadata;
export declare function resolveToolDecisionRole(source: ToolMetadataSource): ToolDecisionRole;
export declare function extractProvidesFromResponseProfile(responseProfile: unknown): string[];
export declare function parseUserToolIntent(userMessage: string): ParsedUserToolIntent;
export declare function filterToolsByAgentMetadata<T extends ToolMetadataSource>(tools: T[], userMessage: string): T[];
export declare function sortToolsByMetadataPriority<T extends ToolMetadataSource>(tools: T[]): T[];
export declare function buildToolEmbedTextFromMetadata(tool: {
    name: string;
    description: string;
    agentMetadata?: unknown;
}): string;
export declare function mergeDecisionRoleIntoResponseProfile(responseProfile: unknown, agentMetadata: AgentMetadata | null, method: string): Record<string, unknown>;
export declare function applyDecisionRoleToResponseProfile(profile: ToolResponseProfile, source: ToolMetadataSource): ToolResponseProfile;
export type ResolveInferredAgentMetadataInput = {
    method: string;
    path: string;
    toolName: string;
    toolDescription: string;
    inputSchema?: unknown;
    existingAgentMetadata?: unknown;
};
export declare function resolveInferredAgentMetadata(llmRaw: unknown, input: ResolveInferredAgentMetadataInput): {
    metadata: AgentMetadata;
    source: 'llm' | 'heuristic' | 'existing';
};
