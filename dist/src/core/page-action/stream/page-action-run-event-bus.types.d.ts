import type { Response } from 'express';
import type { PageActionSseSink } from './page-action-sse-sink.types';
export interface PageActionRunEventBus {
    prepareSession(runId: number): void;
    openWriter(runId: number): PageActionSseSink;
    attachSubscriber(runId: number, res: Response): void;
    closeSession(runId: number): void;
    hasActiveSession(runId: number): boolean;
    hasSession(runId: number): boolean;
}
export declare const PAGE_ACTION_RUN_EVENT_BUS: unique symbol;
