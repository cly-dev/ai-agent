import type { Prisma } from '../../../generated/prisma/client';
import type { ToolDebugResult } from '../../core/tool-engine/tool-engine.types';
import type { AgentMetadata } from '../../core/tool-engine/tool-agent-metadata.types';
import type { ToolResponseProfile } from '../../core/tool-engine/tool-response-profile.types';
export declare const TOOL_DETAIL_INCLUDE: {
    appClient: true;
    toolCategory: true;
    integration: true;
    agentTools: {
        include: {
            agent: {
                select: {
                    id: true;
                    name: true;
                    appClientId: true;
                    enableToolCall: true;
                    maxSteps: true;
                };
            };
        };
    };
    skillTools: {
        include: {
            skill: {
                select: {
                    id: true;
                    name: true;
                    description: true;
                };
            };
        };
    };
    roleTools: {
        include: {
            role: {
                select: {
                    id: true;
                    name: true;
                    allowToolLevel: true;
                };
            };
        };
    };
};
export type ToolDetailRow = Prisma.ToolGetPayload<{
    include: typeof TOOL_DETAIL_INCLUDE;
}>;
export type ToolResponse = ToolDetailRow & {
    tags: string[];
};
export type InitToolSchemasFromDebugResult = {
    debug: ToolDebugResult;
    outputSchema: Record<string, unknown>;
    responseProfile: ToolResponseProfile;
    agentMetadata: AgentMetadata;
    source: 'llm' | 'fallback';
    agentMetadataSource: 'llm' | 'heuristic' | 'existing';
    persisted: boolean;
    tool: ToolResponse;
};
