import type { BuiltLangChainTools } from '../tool-engine/tool-engine.types';
import type { DynamicStructuredTool } from '@langchain/core/tools';
import type { ToolBuildContext } from '../tool-engine/tool-engine.types';
export type IntentScopeTool = {
    id: number;
    name: string;
    description: string;
    inputSchema: unknown;
    schema: unknown;
    method: import('../../../generated/prisma/client').HttpMethod;
    path: string;
    timeout: number | null;
    integration: {
        id: number;
        name: string;
        baseUrl: string;
        authMode: import('../../../generated/prisma/client').IntegrationAuthMode;
        apiKey: string | null;
    };
    toolCategoryId: number | null;
    responseProfile: unknown;
    agentMetadata: unknown;
};
export type ResolveIntentScopeInput = {
    userMessage: string;
    tools: IntentScopeTool[];
    toolBuildCtx: ToolBuildContext;
    enableToolCall: boolean;
    smallTalkHints: string[];
    buildLangChain?: boolean;
};
export type ResolvedIntentScope = {
    intentKind: 'task' | 'smalltalk' | 'unclear' | 'skipped';
    intentClear: boolean;
    matchedCategoryIds: number[];
    includeUncategorized: boolean;
    scopedTools: IntentScopeTool[];
    scopedToolIds: number[];
    scopedLangChainTools: DynamicStructuredTool[];
    scopedToolBundle: BuiltLangChainTools | null;
    scopedAllowedToolIds: number[];
    bindCap?: Record<string, unknown>;
    fallbackReason?: 'bind_recall_error' | 'bind_recall_empty';
    recallSource?: string;
    recallMatches?: Array<{
        id: number;
        label: string;
        score: number;
        source: string;
    }>;
    toolsBeforeIntentNarrow?: number;
    toolsAfterIntentNarrow?: number;
};
