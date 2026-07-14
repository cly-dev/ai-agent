export declare function isPageActionFillDebugEnabled(): boolean;
export declare function truncateForPageActionLog(text: string, max?: number): string;
export type PageActionFillStreamProbe = {
    actionRunId: number;
    actionKey: string;
    streamId: string;
    deltaEvents: number;
    deltaChars: number;
    emptyDeltaEvents: number;
    routedMessageChars: number;
    firstDeltaPreview: string | null;
    lastDeltaPreview: string | null;
    sawDoneDelta: boolean;
};
export declare function createPageActionFillStreamProbe(input: {
    actionRunId: number;
    actionKey: string;
    streamId: string;
}): PageActionFillStreamProbe;
export declare function recordPageActionFillStreamDelta(probe: PageActionFillStreamProbe, contentDelta: string, done: boolean): void;
export declare function recordPageActionFillRoutedMessage(probe: PageActionFillStreamProbe, messageDelta: string): void;
export type PageActionFillDebugRecord = {
    phase: 'stream_end' | 'empty_fill' | 'error' | 'dispatched';
    writtenAt: string;
    actionRunId: number;
    actionKey: string;
    streamId: string;
    model: string | null;
    probe: PageActionFillStreamProbe;
    metrics: Record<string, unknown>;
    rawPreview?: string;
    streamResultPreview?: string;
    fillTextPreview?: string;
    hint?: string;
};
export declare function logPageActionFillStart(probe: PageActionFillStreamProbe): void;
export declare function logPageActionFillStreamEnd(input: {
    probe: PageActionFillStreamProbe;
    model: string | null;
    sessionFillTextLen: number;
    streamResultContentLen: number;
    appendCount: number;
    rawAccumulatedLen: number;
    rawPreview?: string;
    streamResultPreview?: string;
    streamMeta?: {
        emittedDeltaCount: number;
        fellBackToInvoke: boolean;
    };
}): void;
export declare function logPageActionFillFallback(input: {
    probe: PageActionFillStreamProbe;
    source: 'streamResult.content' | 'routed_message';
    beforeLen: number;
    afterLen: number;
    preview?: string;
}): void;
export declare function logPageActionFillEmpty(input: {
    probe: PageActionFillStreamProbe;
    model: string | null;
    rawAccumulatedLen?: number;
    rawPreview?: string;
    sanitizedFillLen: number;
    streamResultContentLen: number;
    streamResultPreview?: string;
    appendCount: number;
}): void;
export declare function logPageActionFillError(probe: PageActionFillStreamProbe, error: unknown): void;
export declare function logPageActionFillDispatched(input: {
    probe: PageActionFillStreamProbe;
    fillTextLen: number;
    appendCount: number;
    fillTextPreview?: string;
}): void;
