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
