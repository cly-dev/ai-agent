import type Redis from 'ioredis';

const DEFAULT_PATCH_MAX_RETRIES = 8;

function parseSessionContextRecord(raw: string | null): Record<string, unknown> {
  if (raw === null) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function atomicPatchSessionContextLoop(input: {
  client: Redis;
  key: string;
  ttlSeconds: number;
  maxRetries?: number;
  onCorruptJson?: () => void;
  buildPartial: (current: Record<string, unknown>) => Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const maxRetries = input.maxRetries ?? DEFAULT_PATCH_MAX_RETRIES;

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    await input.client.watch(input.key);
    const raw = await input.client.get(input.key);
    const current = parseSessionContextRecord(raw);
    if (raw !== null && Object.keys(current).length === 0) {
      input.onCorruptJson?.();
    }
    const partial = input.buildPartial(current);
    const merged: Record<string, unknown> = { ...current, ...partial };
    const body = JSON.stringify(merged);
    const execResult = await input.client
      .multi()
      .set(input.key, body, 'EX', input.ttlSeconds)
      .exec();

    if (execResult !== null) {
      return merged;
    }
  }

  throw new Error(
    `session context atomic patch failed after ${maxRetries} concurrent conflicts`,
  );
}

/**
 * WATCH/MULTI 浅合并 patch，避免并发 read-modify-write 丢失字段。
 * 冲突时自动重试；`exec` 返回 null 表示 watch key 被其他客户端修改。
 */
export async function atomicShallowPatchSessionContext(input: {
  client: Redis;
  key: string;
  partial: Record<string, unknown>;
  ttlSeconds: number;
  maxRetries?: number;
  onCorruptJson?: () => void;
}): Promise<Record<string, unknown>> {
  return atomicPatchSessionContextLoop({
    client: input.client,
    key: input.key,
    ttlSeconds: input.ttlSeconds,
    maxRetries: input.maxRetries,
    onCorruptJson: input.onCorruptJson,
    buildPartial: () => input.partial,
  });
}

/** merge 在 WATCH 事务内执行，适合 episode/turns 等读-改-写数组字段。 */
export async function atomicMergePatchSessionContext(input: {
  client: Redis;
  key: string;
  ttlSeconds: number;
  maxRetries?: number;
  onCorruptJson?: () => void;
  merge: (current: Record<string, unknown>) => Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  return atomicPatchSessionContextLoop({
    client: input.client,
    key: input.key,
    ttlSeconds: input.ttlSeconds,
    maxRetries: input.maxRetries,
    onCorruptJson: input.onCorruptJson,
    buildPartial: input.merge,
  });
}
