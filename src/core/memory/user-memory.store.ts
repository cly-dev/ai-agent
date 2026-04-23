import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { assertPositiveIntId } from './memory-id.util';
import { getDefaultUserMemoryTtlSec } from './memory.constants';
import { RedisConnectionService } from './redis/redis-connection.service';
import { userMemoryKey } from './redis/redis-keys';

@Injectable()
export class UserMemoryStore {
  private readonly logger = new Logger(UserMemoryStore.name);

  constructor(private readonly redis: RedisConnectionService) {}

  async get(userId: number): Promise<Record<string, unknown> | null> {
    assertPositiveIntId('userId', userId);
    const client = this.redis.getClient();
    if (!client) {
      return null;
    }
    const raw = await client.get(userMemoryKey(userId));
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
      this.logger.warn(`corrupt user memory JSON for userId=${userId}`);
      return null;
    }
  }

  /**
   * @param ttlSeconds 覆盖本次写入 TTL；未传则使用环境默认（0 表示不过期）
   */
  async set(
    userId: number,
    payload: Record<string, unknown>,
    ttlSeconds?: number,
  ): Promise<void> {
    assertPositiveIntId('userId', userId);
    const client = this.requireClient();
    const key = userMemoryKey(userId);
    const body = JSON.stringify(payload);
    const ttl =
      ttlSeconds !== undefined ? ttlSeconds : getDefaultUserMemoryTtlSec();
    if (ttl > 0) {
      await client.set(key, body, 'EX', ttl);
    } else {
      await client.set(key, body);
    }
  }

  async delete(userId: number): Promise<void> {
    assertPositiveIntId('userId', userId);
    const client = this.requireClient();
    await client.del(userMemoryKey(userId));
  }

  private requireClient() {
    const client = this.redis.getClient();
    if (!client) {
      throw new ServiceUnavailableException('Redis is not available');
    }
    return client;
  }
}
