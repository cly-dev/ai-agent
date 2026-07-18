import type { Response } from 'express';
import type {
  BufferedPageActionSseEvent,
  PageActionSseSink,
} from './page-action-sse-sink.types';

/** 空闲心跳间隔：防止 nginx / LB proxy_read_timeout 在 LLM 长等待时掐断连接。 */
export const PAGE_ACTION_SSE_HEARTBEAT_MS = 15_000;

export function formatPageActionSseChunk(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function isResponseWritable(res: Response): boolean {
  return !res.writableEnded && !res.destroyed;
}

export function createExpressPageActionSseSink(res: Response): PageActionSseSink {
  return {
    get writableEnded() {
      return res.writableEnded || res.destroyed;
    },
    emit(event: string, data: unknown) {
      if (!isResponseWritable(res)) {
        return;
      }
      try {
        res.write(formatPageActionSseChunk(event, data));
      } catch {
        // 客户端已断开；后续 close 回调会从 hub 移除 subscriber
      }
    },
    end() {
      if (!res.writableEnded) {
        try {
          res.end();
        } catch {
          // ignore
        }
      }
    },
  };
}

/**
 * SSE 注释心跳（`: ping`）。EventSource 忽略注释，仅保活 TCP / 代理。
 * 在 res close/finish 时自动停止。
 */
export function startPageActionSseHeartbeat(
  res: Response,
  intervalMs = PAGE_ACTION_SSE_HEARTBEAT_MS,
): () => void {
  const timer = setInterval(() => {
    if (!isResponseWritable(res)) {
      clearInterval(timer);
      return;
    }
    try {
      res.write(`: ping ${Date.now()}\n\n`);
    } catch {
      clearInterval(timer);
    }
  }, intervalMs);

  const stop = (): void => {
    clearInterval(timer);
  };
  res.on('close', stop);
  res.on('finish', stop);
  return stop;
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
  // 与 Nest @Sse 对齐：禁 socket 空闲超时，开 TCP keepalive
  const socket = res.socket;
  if (socket) {
    socket.setTimeout(0);
    socket.setKeepAlive(true);
  }
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }
}
