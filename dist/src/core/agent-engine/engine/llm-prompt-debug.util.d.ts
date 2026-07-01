import type { LlmChatMessage } from '../../llm/llm.types';
export type LlmPromptDebugPhase = 'decision' | 'summarize' | 'intent' | 'gather_page_summary' | 'other';
export type LlmPromptDebugRecord = {
    runId: number;
    sessionId: string;
    phase: LlmPromptDebugPhase;
    step?: number;
    iteration?: number;
    messageTokenBudget?: number;
    estimatedTokens: number;
    writtenAt: string;
    meta?: Record<string, unknown>;
    messages: Array<{
        index: number;
        role: string;
        estimatedTokens: number;
        content: string;
        toolCallId?: string;
    }>;
};
export declare function isLlmPromptDebugEnabled(): boolean;
export declare function formatLlmPromptDebugForConsole(record: LlmPromptDebugRecord): string;
export declare function emitLlmPromptDebug(log: (message: string) => void, input: {
    runId: number;
    sessionId: string;
    phase: LlmPromptDebugPhase;
    step?: number;
    iteration?: number;
    messageTokenBudget?: number;
    meta?: Record<string, unknown>;
    messages: Array<{
        role: string;
        content: string;
        toolCallId?: string;
    } | LlmChatMessage>;
}): string | null;
export declare function isLlmPromptDebugFileEnabled(): boolean;
export declare function writeLlmPromptDebugFile(input: {
    runId: number;
    sessionId: string;
    phase: LlmPromptDebugPhase;
    step?: number;
    iteration?: number;
    messageTokenBudget?: number;
    meta?: Record<string, unknown>;
    messages: Array<{
        role: string;
        content: string;
        toolCallId?: string;
    } | LlmChatMessage>;
}): string | null;
