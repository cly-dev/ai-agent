import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { assertSessionContextId } from '../shared/memory-id.util';
import { getDefaultSessionContextTtlSec } from '../shared/memory.constants';
import { RedisConnectionService } from '../redis/redis-connection.service';
import { sessionContextKey } from '../redis/redis-keys';
import type { SessionContextPayload } from './session-context.types';
import {
  atomicMergePatchSessionContext,
  atomicShallowPatchSessionContext,
} from './session-context-patch.util';

@Injectable()
export class SessionContextStore {
  private readonly logger = new Logger(SessionContextStore.name);

  constructor(private readonly redis: RedisConnectionService) {}

  async get(sessionId: string): Promise<Record<string, unknown> | null> {
    assertSessionContextId('sessionId', sessionId);
    const client = this.redis.getClient();
    if (!client) {
      return null;
    }
    const raw = await client.get(sessionContextKey(sessionId));
    if (raw === null) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
      }
      return parsed as Record<string, unknown>;
    } catch {
      this.logger.warn(`corrupt session context JSON for sessionId=${sessionId}`);
      return null;
    }
  }

  /** 全量替换上下文并刷新 TTL */
  async set(
    sessionId: string,
    payload: Record<string, unknown>,
    ttlSeconds?: number,
  ): Promise<void> {
    assertSessionContextId('sessionId', sessionId);
    const client = this.requireClient();
    const key = sessionContextKey(sessionId);
    const ttl = ttlSeconds ?? getDefaultSessionContextTtlSec();
    const body = JSON.stringify(payload);
    await client.set(key, body, 'EX', ttl);
  }

  /** Redis 未配置时不抛错，用于 compose 回写缓存。 */
  async trySet(
    sessionId: string,
    payload: SessionContextPayload,
    ttlSeconds?: number,
  ): Promise<boolean> {
    assertSessionContextId('sessionId', sessionId);
    const client = this.redis.getClient();
    if (!client) {
      return false;
    }
    const ttl = ttlSeconds ?? getDefaultSessionContextTtlSec();
    await client.set(
      sessionContextKey(sessionId),
      JSON.stringify(payload),
      'EX',
      ttl,
    );
    return true;
  }

  /** 浅合并顶层字段并刷新 TTL（WATCH/MULTI 原子更新，冲突自动重试）。 */
  async patch(
    sessionId: string,
    partial: Record<string, unknown>,
    ttlSeconds?: number,
  ): Promise<Record<string, unknown>> {
    assertSessionContextId('sessionId', sessionId);
    const client = this.requireClient();
    const key = sessionContextKey(sessionId);
    const ttl = ttlSeconds ?? getDefaultSessionContextTtlSec();
    try {
      return await atomicShallowPatchSessionContext({
        client,
        key,
        partial,
        ttlSeconds: ttl,
        onCorruptJson: () => {
          this.logger.warn(`corrupt session context JSON for sessionId=${sessionId}`);
        },
      });
    } catch (error) {
      throw new ServiceUnavailableException(
        error instanceof Error ? error.message : 'session context patch failed',
      );
    }
  }

  /** merge 在原子 patch 内执行，冲突自动重试。 */
  async patchMerge(
    sessionId: string,
    merge: (current: Record<string, unknown>) => Record<string, unknown>,
    ttlSeconds?: number,
  ): Promise<Record<string, unknown>> {
    assertSessionContextId('sessionId', sessionId);
    const client = this.requireClient();
    const key = sessionContextKey(sessionId);
    const ttl = ttlSeconds ?? getDefaultSessionContextTtlSec();
    try {
      return await atomicMergePatchSessionContext({
        client,
        key,
        ttlSeconds: ttl,
        merge,
        onCorruptJson: () => {
          this.logger.warn(`corrupt session context JSON for sessionId=${sessionId}`);
        },
      });
    } catch (error) {
      throw new ServiceUnavailableException(
        error instanceof Error ? error.message : 'session context patch failed',
      );
    }
  }

  /** Redis 未配置或 patch 失败时不抛错。 */
  async tryPatch(
    sessionId: string,
    partial: Record<string, unknown>,
    ttlSeconds?: number,
  ): Promise<Record<string, unknown> | null> {
    assertSessionContextId('sessionId', sessionId);
    const client = this.redis.getClient();
    if (!client) {
      return null;
    }
    const key = sessionContextKey(sessionId);
    const ttl = ttlSeconds ?? getDefaultSessionContextTtlSec();
    try {
      return await atomicShallowPatchSessionContext({
        client,
        key,
        partial,
        ttlSeconds: ttl,
        onCorruptJson: () => {
          this.logger.warn(`corrupt session context JSON for sessionId=${sessionId}`);
        },
      });
    } catch (error) {
      this.logger.warn(
        `session context tryPatch skipped sessionId=${sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  async tryPatchMerge(
    sessionId: string,
    merge: (current: Record<string, unknown>) => Record<string, unknown>,
    ttlSeconds?: number,
  ): Promise<Record<string, unknown> | null> {
    assertSessionContextId('sessionId', sessionId);
    const client = this.redis.getClient();
    if (!client) {
      return null;
    }
    const key = sessionContextKey(sessionId);
    const ttl = ttlSeconds ?? getDefaultSessionContextTtlSec();
    try {
      return await atomicMergePatchSessionContext({
        client,
        key,
        ttlSeconds: ttl,
        merge,
        onCorruptJson: () => {
          this.logger.warn(`corrupt session context JSON for sessionId=${sessionId}`);
        },
      });
    } catch (error) {
      this.logger.warn(
        `session context tryPatchMerge skipped sessionId=${sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  /** 仅续期 TTL，不改变值 */
  async touch(sessionId: string, ttlSeconds?: number): Promise<void> {
    assertSessionContextId('sessionId', sessionId);
    const client = this.requireClient();
    const key = sessionContextKey(sessionId);
    const ttl = ttlSeconds ?? getDefaultSessionContextTtlSec();
    const n = await client.expire(key, ttl);
    if (n !== 1) {
      throw new ServiceUnavailableException(
        'session context key missing; cannot refresh TTL',
      );
    }
  }

  async delete(sessionId: string): Promise<void> {
    assertSessionContextId('sessionId', sessionId);
    const client = this.requireClient();
    await client.del(sessionContextKey(sessionId));
  }

  private requireClient() {
    const client = this.redis.getClient();
    if (!client) {
      throw new ServiceUnavailableException('Redis is not available');
    }
    return client;
  }
}
