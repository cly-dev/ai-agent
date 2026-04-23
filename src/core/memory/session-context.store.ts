import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { assertSessionContextId } from './memory-id.util';
import { getDefaultSessionContextTtlSec } from './memory.constants';
import { RedisConnectionService } from './redis/redis-connection.service';
import { sessionContextKey } from './redis/redis-keys';

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

  /** 浅合并顶层字段并刷新 TTL */
  async patch(
    sessionId: string,
    partial: Record<string, unknown>,
    ttlSeconds?: number,
  ): Promise<Record<string, unknown>> {
    assertSessionContextId('sessionId', sessionId);
    const client = this.requireClient();
    const key = sessionContextKey(sessionId);
    const ttl = ttlSeconds ?? getDefaultSessionContextTtlSec();
    const current = (await this.get(sessionId)) ?? {};
    const merged: Record<string, unknown> = { ...current, ...partial };
    await client.set(key, JSON.stringify(merged), 'EX', ttl);
    return merged;
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
