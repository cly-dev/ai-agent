import type { LlmService } from '../llm/llm.service';
import type { LlmChatMessage } from '../llm/llm.types';
import type { PromptBudgetHints } from '../llm/prompt-budget/prompt-budget.types';
import type { PageActionRunStepRecorder } from './page-action-run-steps.util';
import { type PageActionLifecyclePayload } from './page-action-inline-sse.util';
import type { PageActionSseSink } from './stream/page-action-sse-sink.types';
export type PageActionProseStreamResult = {
    summaryText: string;
    model: string | null;
    promptTokens: number | null;
    completionTokens: number | null;
    deltaCount: number;
};
type PageActionStreamLifecycle = Pick<PageActionLifecyclePayload, 'actionRunId' | 'actionKey' | 'delivery' | 'generation' | 'streamId' | 'clientActionId'>;
export declare function replayPageActionProseStream(input: {
    sseSink: PageActionSseSink;
    fillText: string;
    lifecycle: PageActionStreamLifecycle;
}): number;
export declare function executePageActionProseStream(input: {
    llmService: LlmService;
    messages: LlmChatMessage[];
    sseSink: PageActionSseSink;
    actionRunId: number;
    actionKey: string;
    generation: number;
    streamId: string;
    clientActionId?: string | null;
    stepRecorder?: PageActionRunStepRecorder;
    budgetHints?: PromptBudgetHints;
    signal?: AbortSignal;
    llmAudit?: {
        startName?: string;
        endName?: string;
        startDetail?: Record<string, unknown>;
    };
}): Promise<PageActionProseStreamResult>;
export {};
