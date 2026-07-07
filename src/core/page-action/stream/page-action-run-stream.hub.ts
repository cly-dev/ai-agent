import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import type { PageActionRunEventBus } from './page-action-run-event-bus.types';
import type {
  BufferedPageActionSseEvent,
  PageActionSseSink,
} from './page-action-sse-sink.types';
import {
  createExpressPageActionSseSink,
  initPageActionSseResponse,
  replayBufferedEvents,
} from './page-action-sse-sink.util';

type RunStreamSession = {
  buffer: BufferedPageActionSseEvent[];
  subscribers: Set<PageActionSseSink>;
  writerOpen: boolean;
  /** closeSession 后为 true；与 writerOpen=false 且未 close 区分「尚未开写」 */
  closed: boolean;
};

@Injectable()
export class PageActionRunStreamHub implements PageActionRunEventBus {
  private readonly sessions = new Map<number, RunStreamSession>();

  prepareSession(runId: number): void {
    const session = this.ensureSession(runId);
    session.closed = false;
  }

  openWriter(runId: number): PageActionSseSink {
    const session = this.ensureSession(runId);
    session.writerOpen = true;
    session.closed = false;
    return this.createWriterSink(session);
  }

  attachSubscriber(runId: number, res: Response): void {
    initPageActionSseResponse(res);
    const sink = createExpressPageActionSseSink(res);
    const session = this.ensureSession(runId);

    replayBufferedEvents(sink, session.buffer);

    if (session.closed) {
      sink.end();
      return;
    }

    session.subscribers.add(sink);
    res.on('close', () => {
      session.subscribers.delete(sink);
    });
  }

  closeSession(runId: number): void {
    const session = this.sessions.get(runId);
    if (!session) {
      return;
    }
    session.writerOpen = false;
    session.closed = true;
    for (const subscriber of session.subscribers) {
      subscriber.end();
    }
    session.subscribers.clear();
  }

  hasActiveSession(runId: number): boolean {
    const session = this.sessions.get(runId);
    return session?.writerOpen === true;
  }

  hasSession(runId: number): boolean {
    const session = this.sessions.get(runId);
    return session != null && !session.closed;
  }

  private ensureSession(runId: number): RunStreamSession {
    let session = this.sessions.get(runId);
    if (!session) {
      session = {
        buffer: [],
        subscribers: new Set(),
        writerOpen: false,
        closed: false,
      };
      this.sessions.set(runId, session);
    }
    return session;
  }

  private createWriterSink(session: RunStreamSession): PageActionSseSink {
    let ended = false;
    return {
      get writableEnded() {
        return ended || !session.writerOpen;
      },
      emit(event: string, data: unknown) {
        if (ended || !session.writerOpen) {
          return;
        }
        const row: BufferedPageActionSseEvent = { event, data };
        session.buffer.push(row);
        for (const subscriber of session.subscribers) {
          if (!subscriber.writableEnded) {
            subscriber.emit(event, data);
          }
        }
      },
      end() {
        ended = true;
      },
    };
  }
}
