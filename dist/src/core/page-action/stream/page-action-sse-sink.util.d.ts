import type { Response } from 'express';
import type { BufferedPageActionSseEvent, PageActionSseSink } from './page-action-sse-sink.types';
export declare const PAGE_ACTION_SSE_HEARTBEAT_MS = 15000;
export declare function formatPageActionSseChunk(event: string, data: unknown): string;
export declare function createExpressPageActionSseSink(res: Response): PageActionSseSink;
export declare function startPageActionSseHeartbeat(res: Response, intervalMs?: number): () => void;
export declare function createNullPageActionSseSink(): PageActionSseSink;
export declare function replayBufferedEvents(sink: PageActionSseSink, events: BufferedPageActionSseEvent[]): void;
export declare function initPageActionSseResponse(res: Response): void;
