import type { LoadingBlock, MessageBlock, MessageBlockPatch, RenderPlanHint } from './message-blocks.types';
export declare function isStructuredMessageBlock(block: MessageBlock): block is Exclude<MessageBlock, {
    type: 'text';
} | {
    type: 'loading';
}>;
export declare function loadingHintForStructuredBlock(block: MessageBlock): string;
export declare function shouldBufferSummarizeLlmStream(ruleBlocks: MessageBlock[]): boolean;
export declare function looksLikeBlocksJsonOutput(text: string): boolean;
export declare function findSummarizeBlocksJsonTailStart(text: string): number;
export declare function stripBlocksJsonTailFromStreamedProse(text: string): string;
export declare function sanitizeSummarizeUserFacingProse(text: string): string;
export declare function isStreamedProseFenceGarbage(text: string): boolean;
export declare function isLikelySummarizeBlocksJsonStart(text: string): boolean;
export declare function findInlineSummarizeBlocksJsonStart(messageText: string, emittedProseLength: number): number;
export type SummarizeMessageStreamMode = 'detect' | 'prose' | 'buffer' | 'fence' | 'json_text';
export type SummarizeMessageStreamState = {
    mode: SummarizeMessageStreamMode;
    messageText: string;
    emittedProseLength: number;
    jsonContentValueStart?: number;
    fenceStartIndex?: number;
};
export declare function findSingleTextBlockContentValueStart(text: string): number | null;
export declare function decodePartialJsonStringAt(text: string, openQuoteIndex: number): {
    decoded: string;
    closed: boolean;
};
export declare function summarizeStreamedProseFromState(state: SummarizeMessageStreamState): string;
export declare function createSummarizeMessageStreamState(): SummarizeMessageStreamState;
export declare function processSummarizeMessageStreamChunk(state: SummarizeMessageStreamState, chunk: string): {
    state: SummarizeMessageStreamState;
    delta: string;
};
export declare function stripMarkdownFenceForBlocksParse(text: string): string;
export declare function normalizeSupplementaryTextContent(content: string, ruleBlocks: MessageBlock[]): string;
export declare function stripRedundantSummarizeTextBlocks(ruleBlocks: MessageBlock[], blocks: MessageBlock[]): MessageBlock[];
export declare function mergeSummarizeBlocksForStorage(ruleBlocks: MessageBlock[], llmBlocks: MessageBlock[], fallbackPlainText: string): MessageBlock[];
export declare function mergeStreamedDeltaTextForStorage(ruleBlocks: MessageBlock[], llmBlocks: MessageBlock[], streamedMessageText: string): MessageBlock[];
export declare function filterLlmBlocksAvoidDuplicatingRule(ruleBlocks: MessageBlock[], llmBlocks: MessageBlock[]): MessageBlock[];
export declare function planStructuredBlockStreaming(runId: number, blocks: MessageBlock[]): {
    placeholders: LoadingBlock[];
    patches: MessageBlockPatch[];
};
export declare function inferRenderHint(userMessage: string): RenderPlanHint;
export declare function normalizeMessageBlocks(blocks: MessageBlock[]): MessageBlock[];
export declare function parseMessageBlocksPayload(value: unknown): MessageBlock[] | null;
export declare function tryParseStoredMessageBlocks(value: string): MessageBlock[] | null;
export declare function tryParseLlmBlocksFromSummarizeOutput(value: string): MessageBlock[] | null;
export declare function sanitizeMessageBlocks(blocks: MessageBlock[]): MessageBlock[];
export declare function serializeMessageBlocksForStorage(blocks: MessageBlock[]): string;
export declare function sanitizeStoredFinalOutput(value: string): string;
export declare function nextSanitizedSummarizeStreamDelta(proseSnapshot: string, previouslyEmitted: string): {
    delta: string;
    emitted: string;
};
export declare function extractStreamableProseFromBlocks(blocks: MessageBlock[]): string;
export declare function messageBlocksToPlainText(blocks: MessageBlock[]): string;
export declare function mergeMessageBlocks(primary: MessageBlock[], secondary: MessageBlock[]): MessageBlock[];
export declare function extractDetailRecordFromToolOutput(output: unknown): Record<string, unknown>[];
export declare function extractListRowsFromToolOutput(output: unknown): Record<string, unknown>[];
export declare function mergeToolOutputsForSummary(outputs: unknown[]): unknown;
export declare function tryBuildTableBlockFromOutput(output: unknown, fieldLabels: Record<string, string>, maxRows?: number): MessageBlock | null;
export declare function tryBuildChartBlockFromOutput(output: unknown, userMessage: string): MessageBlock | null;
export declare function buildRuleBasedMessageBlocks(input: {
    output: unknown;
    userMessage: string;
    fieldLabels: Record<string, string>;
    toolErrorHint?: string | null;
    downstreamResponseSource?: unknown;
}): MessageBlock[];
export declare function textBlock(content: string, format?: 'markdown' | 'plain'): MessageBlock;
export declare function ensureAtLeastOneTextBlock(blocks: MessageBlock[], fallbackText: string): MessageBlock[];
