export type SummarizeProseStreamCallbacks = {
    onProseDelta: (delta: string) => void;
    onThinkDelta?: (delta: string) => void;
};
export type SummarizeProseStreamSession = {
    ingestLlmDelta: (contentDelta: string) => void;
    replayRoutedMessage: (routedMessage: string) => void;
    resolveUserMarkdown: (input: {
        llmFinal?: string;
        routedMessage?: string;
    }) => string;
    readonly sanitizedEmitted: string;
    readonly messageDeltaEmitted: boolean;
    readonly proseStreamSuperseded: boolean;
};
export declare function createSummarizeProseStreamSession(callbacks: SummarizeProseStreamCallbacks): SummarizeProseStreamSession;
export declare function finalizeSummarizeProseStreamAfterLlm(input: {
    session: SummarizeProseStreamSession;
    rawStreamedText: string;
    rawResultText: string;
    onReplay?: (reason: 'invoke_fallback' | 'buffer_or_json_no_delta') => void;
}): {
    userMarkdown: string;
    routedMessage: string;
    rawLlmSource: string;
};
export declare function resolveSummarizeLlmProseForStorage(input: {
    proseSession: SummarizeProseStreamSession;
    rawSource: string;
    userMarkdown: string;
    routedMessage: string;
    fallbackPlainText: string;
}): string;
