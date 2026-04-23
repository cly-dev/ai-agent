import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';

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
      this.client = url
        ? new Redis(url, { maxRetriesPerRequest: 2, password })
        : new Redis({
            host,
            port: Number.parseInt(process.env.REDIS_PORT ?? '6379', 10),
            password,
            db: process.env.REDIS_DB
              ? Number.parseInt(process.env.REDIS_DB, 10)
              : undefined,
            maxRetriesPerRequest: 2,
          });
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
}
