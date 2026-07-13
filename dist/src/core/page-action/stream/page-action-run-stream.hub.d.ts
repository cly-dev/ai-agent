import type { Response } from 'express';
import type { PageActionRunEventBus } from './page-action-run-event-bus.types';
import type { PageActionSseSink } from './page-action-sse-sink.types';
export declare class PageActionRunStreamHub implements PageActionRunEventBus {
    private readonly sessions;
    prepareSession(runId: number): void;
    openWriter(runId: number): PageActionSseSink;
    attachSubscriber(runId: number, res: Response): void;
    closeSession(runId: number): void;
    hasActiveSession(runId: number): boolean;
    hasSession(runId: number): boolean;
    private ensureSession;
    private createWriterSink;
}
