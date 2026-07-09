import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import type { LlmService } from '../llm/llm.service';
import type { LlmChatMessage } from '../llm/llm.types';
import type { PromptBudgetHints } from '../llm/prompt-budget/prompt-budget.types';
import type { ResolvedPageActionHostTool } from './page-action-host-tool.util';
import type { PageActionRunStepRecorder } from './page-action-run-steps.util';
import type { PageActionSseSink } from './stream/page-action-sse-sink.types';
export type PageActionLlmDslStreamResult = {
    fillText: string;
    dslOutcome: 'dispatched' | 'failed' | 'skipped';
    model: string | null;
    promptTokens: number | null;
    completionTokens: number | null;
    appendCount: number;
    streamable: boolean;
};
export declare function canPageActionUseDslStream(hostTool: ResolvedPageActionHostTool): boolean;
export declare function executePageActionLlmDslStream(input: {
    llmService: LlmService;
    messages: LlmChatMessage[];
    sseSink: PageActionSseSink;
    pageContext: AgentChatPageContext | null;
    actionRunId: number;
    generation: number;
    streamId: string;
    hostTool: ResolvedPageActionHostTool;
    reason: string;
    stepRecorder?: PageActionRunStepRecorder;
    signal?: AbortSignal;
    budgetHints?: PromptBudgetHints;
    llmAudit?: {
        startName?: string;
        endName?: string;
    };
    onLlmDelta?: (delta: {
        contentDelta: string;
        done?: boolean;
    }) => void;
}): Promise<PageActionLlmDslStreamResult>;
