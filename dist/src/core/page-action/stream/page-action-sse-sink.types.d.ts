export type PageActionSseSink = {
    readonly writableEnded: boolean;
    emit(event: string, data: unknown): void;
    end(): void;
};
export type BufferedPageActionSseEvent = {
    event: string;
    data: unknown;
};
