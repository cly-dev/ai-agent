import type { LlmChatMessage } from '../llm/llm.types';
export type PageActionRunDebugStage = 'invoke' | 'prompt' | 'llm_request' | 'llm_response' | 'dsl' | 'result' | 'error';
export declare function logPageActionRunDebug(stage: PageActionRunDebugStage | string, payload: Record<string, unknown> & {
    actionRunId: number;
    actionKey?: string | null;
}): string | null;
export declare function logPageActionLlmPrompt(input: {
    actionRunId: number;
    actionKey?: string | null;
    phase: string;
    messages: Array<{
        role: string;
        content: string;
        toolCallId?: string;
    } | LlmChatMessage>;
    meta?: Record<string, unknown>;
}): string | null;
export declare function logPageActionLlmResponse(input: {
    actionRunId: number;
    actionKey?: string | null;
    phase: string;
    model?: string | null;
    promptTokens?: number | null;
    completionTokens?: number | null;
    detail: Record<string, unknown>;
}): string | null;
