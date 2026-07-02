import type { ConnectionOptions } from 'bullmq';

/** BullMQ 需要 `maxRetriesPerRequest: null`（与通用 Redis 客户端不同）。 */
export function buildSessionRunBullMqConnection(): ConnectionOptions | null {
  const url = process.env.REDIS_URL?.trim();
  const host = process.env.REDIS_HOST?.trim();
  if (!url && !host) {
    return null;
  }
  const password = process.env.REDIS_PASSWORD?.trim() || undefined;
  if (url) {
    return { url, password, maxRetriesPerRequest: null };
  }
  return {
    host,
    port: Number.parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password,
    db: process.env.REDIS_DB
      ? Number.parseInt(process.env.REDIS_DB, 10)
      : undefined,
    maxRetriesPerRequest: null,
  };
}

export function readSessionRunWorkerConcurrency(): number {
  const raw = process.env.SESSION_RUN_WORKER_CONCURRENCY?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : 8;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8;
}

/** 默认 true（本地单进程）；生产 API 节点设 0，独立 Worker 节点设 1。 */
export function readSessionRunWorkerEnabled(): boolean {
  const raw = process.env.SESSION_RUN_WORKER_ENABLED?.trim().toLowerCase();
  if (raw === '0' || raw === 'false' || raw === 'no') {
    return false;
  }
  return true;
}

export function readSessionRunJobAttempts(): number {
  const raw = process.env.SESSION_RUN_JOB_ATTEMPTS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : 3;
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 3;
}

/** Worker 专用进程可设 0，避免与 API 争抢同一 HTTP 端口。默认 true。 */
export function readHttpServerEnabled(): boolean {
  const raw = process.env.SESSION_RUN_HTTP_ENABLED?.trim().toLowerCase();
  if (raw === '0' || raw === 'false' || raw === 'no') {
    return false;
  }
  return true;
}
