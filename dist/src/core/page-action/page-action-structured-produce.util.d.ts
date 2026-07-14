import type { HostToolDecisionDefinition } from '../host-bridge/host-tool-decision.types';
import type { LlmService } from '../llm/llm.service';
import type { LlmChatMessage } from '../llm/llm.types';
import type { PromptBudgetHints } from '../llm/prompt-budget/prompt-budget.types';
export declare function isLlmAbortError(error: unknown, signal?: AbortSignal): boolean;
export type HostToolToolCallProduceResult = {
    ok: true;
    args: Record<string, unknown>;
    model: string | null;
    promptTokens: number | null;
    completionTokens: number | null;
    llmInvoked: true;
    retryWithStreamParse: false;
    droppedCatalogIds?: Record<string, string[]>;
} | {
    ok: false;
    error: string;
    model: string | null;
    promptTokens: number | null;
    completionTokens: number | null;
    llmInvoked: boolean;
    retryWithStreamParse: boolean;
};
export declare function produceHostToolArgsViaToolCall(input: {
    llmService: LlmService;
    messages: LlmChatMessage[];
    hostTool: HostToolDecisionDefinition;
    actionContext?: Record<string, unknown> | null;
    actionRunId?: number;
    actionKey?: string | null;
    budgetHints?: PromptBudgetHints;
    signal?: AbortSignal;
}): Promise<HostToolToolCallProduceResult>;
