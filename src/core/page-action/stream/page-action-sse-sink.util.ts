import type { Response } from 'express';
import type {
  BufferedPageActionSseEvent,
  PageActionSseSink,
} from './page-action-sse-sink.types';

export function formatPageActionSseChunk(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function createExpressPageActionSseSink(res: Response): PageActionSseSink {
  return {
    get writableEnded() {
      return res.writableEnded;
    },
    emit(event: string, data: unknown) {
      if (res.writableEnded) {
        return;
      }
      res.write(formatPageActionSseChunk(event, data));
    },
    end() {
      if (!res.writableEnded) {
        res.end();
      }
    },
  };
}

export function createNullPageActionSseSink(): PageActionSseSink {
  return {
    writableEnded: false,
    emit() {},
    end() {},
  };
}

export function replayBufferedEvents(
  sink: PageActionSseSink,
  events: BufferedPageActionSseEvent[],
): void {
  for (const row of events) {
    if (sink.writableEnded) {
      return;
    }
    sink.emit(row.event, row.data);
  }
}

export function initPageActionSseResponse(res: Response): void {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }
}
