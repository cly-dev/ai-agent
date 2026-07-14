import type { LlmService } from '../../core/llm/llm.service';
import type { AgentMetadata } from '../../core/tool-engine/tool-agent-metadata.types';
import type { ToolResponseProfile } from '../../core/tool-engine/tool-response-profile.types';
type InferSchemasInput = {
    toolName: string;
    toolDescription: string;
    method: string;
    path: string;
    httpStatus: number;
    sampleData: unknown;
    inputSchema?: unknown;
    hint?: string;
    agentMetadata?: unknown;
};
export type InferredToolSchemas = {
    outputSchema: Record<string, unknown>;
    responseProfile: ToolResponseProfile;
    agentMetadata: AgentMetadata;
    source: 'llm' | 'fallback';
    agentMetadataSource: 'llm' | 'heuristic' | 'existing';
};
export declare function inferToolSchemasFromSample(llmService: LlmService, input: InferSchemasInput, systemPrompt: string): Promise<InferredToolSchemas>;
export {};
