export type LlmRole = 'system' | 'user' | 'assistant' | 'tool';
export type LlmChatMessage = {
    role: LlmRole;
    content: string;
    toolCallId?: string;
};
export type LlmToolDefinition = {
    type: 'function';
    function: {
        name: string;
        description?: string;
        parameters?: Record<string, unknown>;
    };
};
export type LlmToolCall = {
    name: string;
    arguments: Record<string, unknown>;
};
import type { LlmModelKind } from '../../../generated/prisma/client';
import type { PromptBudgetHints } from './prompt-budget/prompt-budget.types';
export type LlmChatInput = {
    messages: LlmChatMessage[];
    tools?: LlmToolDefinition[];
    parameters?: Record<string, unknown>;
    stream?: boolean;
    maxTokens?: number;
    temperature?: number;
    signal?: AbortSignal;
    budgetHints?: PromptBudgetHints;
    messageTokenBudget?: number;
};
export type LlmChatRequest = LlmChatInput & {
    model: string;
};
export type LlmAdapterConfig = {
    baseUrl: string;
    chatPath: string;
    apiKey?: string | null;
};
export type LlmChatResult = {
    content: string;
    toolCalls: LlmToolCall[];
    model: string;
    raw: unknown;
    streamMeta?: {
        emittedDeltaCount: number;
        fellBackToInvoke: boolean;
    };
};
export type LlmStreamDelta = {
    model: string;
    contentDelta: string;
    toolCalls: LlmToolCall[];
    done: boolean;
    raw: unknown;
};
export type LlmStreamHandlers = {
    onDelta?: (delta: LlmStreamDelta) => void;
    signal?: AbortSignal;
};
export type LlmConnectionTestResult = {
    ok: boolean;
    configId: number;
    kind: LlmModelKind;
    provider: string;
    model: string;
    probe: 'chat' | 'embedding_api' | 'embedding_local' | 'unsupported';
    durationMs: number;
    error?: string;
    detail?: Record<string, unknown>;
};
