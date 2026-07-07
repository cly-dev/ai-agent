import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';
import { buildIoRedisClientOptions } from './redis-client-options.util';

@Injectable()
export class RedisConnectionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisConnectionService.name);
  private client: Redis | null = null;

  async onModuleInit(): Promise<void> {
    const url = process.env.REDIS_URL?.trim();
    const host = process.env.REDIS_HOST?.trim();
    const password = process.env.REDIS_PASSWORD?.trim() || undefined;
    if (!url && !host) {
      this.logger.warn(
        'REDIS_URL / REDIS_HOST not set — user memory & session context stores are disabled',
      );
      return;
    }

    try {
      const clientOptions = buildIoRedisClientOptions({ password });
      this.client = url
        ? new Redis(url, clientOptions)
        : new Redis({
            host,
            port: Number.parseInt(process.env.REDIS_PORT ?? '6379', 10),
            db: process.env.REDIS_DB
              ? Number.parseInt(process.env.REDIS_DB, 10)
              : undefined,
            ...clientOptions,
          });
      await this.client.connect();
      await this.client.ping();
      this.logger.log('Redis connected');
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Redis connection failed; memory stores will be unavailable (${reason})`,
        err instanceof Error ? err.stack : String(err),
      );
      if (this.client) {
        this.client.disconnect();
      }
      this.client = null;
    }
  }

  onModuleDestroy(): void {
    if (this.client) {
      void this.client.quit();
      this.client = null;
    }
  }

  /** 未配置或连接失败时为 `null`，调用方应降级或拒绝写操作。 */
  getClient(): Redis | null {
    return this.client;
  }

  async ping(): Promise<{
    ok: boolean;
    configured: boolean;
    error?: string;
  }> {
    const url = process.env.REDIS_URL?.trim();
    const host = process.env.REDIS_HOST?.trim();
    if (!url && !host) {
      return { ok: false, configured: false, error: 'redis not configured' };
    }
    if (!this.client) {
      return { ok: false, configured: true, error: 'redis client unavailable' };
    }
    try {
      await this.client.ping();
      return { ok: true, configured: true };
    } catch (error) {
      return {
        ok: false,
        configured: true,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
