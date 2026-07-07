import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import type Redis from 'ioredis';
import {
  SESSION_RUN_SUPERSEDE_CHANNEL,
  sessionRunActiveKey,
  sessionRunBindingsKey,
  sessionRunDrainLockKey,
  sessionRunGenerationKey,
  sessionRunQueueKey,
} from '../redis/redis-keys';
import { RedisConnectionService } from '../redis/redis-connection.service';
import type {
  SessionRunActiveSnapshot,
  SessionRunSupersedeEvent,
  SupersedeReason,
} from '../../session-run/session-run.types';

const ACTIVE_TTL_SEC = 2 * 60 * 60;
const DRAIN_LOCK_TTL_SEC = 5 * 60;

type RemoteSupersedeHandler = (event: SessionRunSupersedeEvent) => void;

/**
 * Session run 跨实例共享状态：generation、run 绑定、job 队列、drain 锁、supersede 广播。
 */
@Injectable()
export class SessionRunStateStore
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(SessionRunStateStore.name);
  private readonly instanceId = `${hostname()}:${process.pid}:${randomUUID().slice(0, 8)}`;
  private readonly generationLocal = new Map<string, number>();
  private readonly bindingsLocal = new Map<string, number>();
  private productionRedisWarned = false;
  private subscriber: Redis | null = null;
  private remoteSupersedeHandler: RemoteSupersedeHandler | null = null;

  constructor(private readonly redis: RedisConnectionService) {}

  onApplicationBootstrap(): void {
    const isProd =
      process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod';
    const client = this.redis.getClient();
    if (!client) {
      if (isProd) {
        const message = this.redis.isConfigured()
          ? 'SESSION RUN: Redis client unavailable in production — generation will not sync across instances.'
          : 'SESSION RUN: Redis is not configured in production — generation will not sync across instances. Set REDIS_URL or REDIS_HOST.';
        this.logger.error(message);
        this.productionRedisWarned = true;
      }
      return;
    }
    this.subscriber = client.duplicate();
    void this.subscriber
      .subscribe(SESSION_RUN_SUPERSEDE_CHANNEL)
      .then(() => {
        this.subscriber?.on('message', (_channel, raw) => {
          this.handleSupersedeMessage(raw);
        });
      })
      .catch((error) => {
        this.logger.warn(
          `session run supersede subscribe failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });
  }

  onModuleDestroy(): void {
    if (this.subscriber) {
      void this.subscriber.quit();
      this.subscriber = null;
    }
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  setRemoteSupersedeHandler(handler: RemoteSupersedeHandler | null): void {
    this.remoteSupersedeHandler = handler;
  }

  isRedisBacked(): boolean {
    return this.redis.getClient() != null;
  }

  private bindingField(runId: number): string {
    return String(runId);
  }

  private bindingMapKey(sessionId: string, runId: number): string {
    return `${sessionId}:${runId}`;
  }

  private handleSupersedeMessage(raw: string): void {
    if (!this.remoteSupersedeHandler) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as SessionRunSupersedeEvent;
      if (
        typeof parsed.sessionId !== 'string' ||
        typeof parsed.generation !== 'number' ||
        (parsed.reason !== 'user_message' && parsed.reason !== 'cancel_api')
      ) {
        return;
      }
      this.remoteSupersedeHandler(parsed);
    } catch {
      // ignore malformed
    }
  }

  async hydrateGeneration(sessionId: string): Promise<number> {
    const client = this.redis.getClient();
    if (!client) {
      return this.generationLocal.get(sessionId) ?? 0;
    }
    try {
      const raw = await client.get(sessionRunGenerationKey(sessionId));
      const remote = raw != null ? Number.parseInt(raw, 10) : 0;
      const local = this.generationLocal.get(sessionId) ?? 0;
      const merged = Number.isFinite(remote) ? Math.max(local, remote) : local;
      this.generationLocal.set(sessionId, merged);
      return merged;
    } catch (error) {
      this.logger.warn(
        `session run generation hydrate failed sessionId=${sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return this.generationLocal.get(sessionId) ?? 0;
    }
  }

  getGenerationLocal(sessionId: string): number {
    return this.generationLocal.get(sessionId) ?? 0;
  }

  setGenerationLocal(sessionId: string, generation: number): void {
    this.generationLocal.set(sessionId, generation);
  }

  async incrementGeneration(sessionId: string): Promise<number> {
    const client = this.redis.getClient();
    if (client) {
      try {
        const next = await client.incr(sessionRunGenerationKey(sessionId));
        this.generationLocal.set(sessionId, next);
        return next;
      } catch (error) {
        this.logger.warn(
          `session run generation incr failed sessionId=${sessionId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
    const next = (this.generationLocal.get(sessionId) ?? 0) + 1;
    this.generationLocal.set(sessionId, next);
    if (
      !this.productionRedisWarned &&
      (process.env.NODE_ENV === 'production' ||
        process.env.NODE_ENV === 'prod')
    ) {
      this.logger.warn(
        `session run generation incremented in-memory only sessionId=${sessionId}`,
      );
    }
    return next;
  }

  async publishSupersedeEvent(
    event: SessionRunSupersedeEvent,
  ): Promise<void> {
    this.setGenerationLocal(event.sessionId, event.generation);
    const client = this.redis.getClient();
    if (!client) {
      return;
    }
    try {
      await client.publish(
        SESSION_RUN_SUPERSEDE_CHANNEL,
        JSON.stringify(event),
      );
    } catch (error) {
      this.logger.warn(
        `session run supersede publish failed sessionId=${event.sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /** 清理旧版 Redis LIST 队列 key（BullMQ 迁移后仅作遗留 key 回收）。 */
  async clearLegacySessionQueue(sessionId: string): Promise<void> {
    const client = this.redis.getClient();
    if (!client) {
      return;
    }
    try {
      await client.del(sessionRunQueueKey(sessionId));
    } catch {
      // ignore
    }
  }

  async acquireDrainLock(sessionId: string): Promise<boolean> {
    const client = this.redis.getClient();
    if (!client) {
      return true;
    }
    try {
      const result = await client.set(
        sessionRunDrainLockKey(sessionId),
        this.instanceId,
        'EX',
        DRAIN_LOCK_TTL_SEC,
        'NX',
      );
      return result === 'OK';
    } catch (error) {
      this.logger.warn(
        `session run drain lock acquire failed sessionId=${sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }

  async renewDrainLock(sessionId: string): Promise<boolean> {
    const client = this.redis.getClient();
    if (!client) {
      return true;
    }
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("expire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;
    try {
      const result = await client.eval(
        script,
        1,
        sessionRunDrainLockKey(sessionId),
        this.instanceId,
        String(DRAIN_LOCK_TTL_SEC),
      );
      return result === 1;
    } catch {
      return false;
    }
  }

  async releaseDrainLock(sessionId: string): Promise<void> {
    const client = this.redis.getClient();
    if (!client) {
      return;
    }
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    try {
      await client.eval(
        script,
        1,
        sessionRunDrainLockKey(sessionId),
        this.instanceId,
      );
    } catch {
      // ignore
    }
  }

  async bindRunGeneration(
    sessionId: string,
    runId: number,
    generation: number,
  ): Promise<void> {
    this.bindingsLocal.set(this.bindingMapKey(sessionId, runId), generation);
    const client = this.redis.getClient();
    if (!client) {
      return;
    }
    try {
      await client.hset(
        sessionRunBindingsKey(sessionId),
        this.bindingField(runId),
        String(generation),
      );
    } catch (error) {
      this.logger.warn(
        `session run bind failed sessionId=${sessionId} runId=${runId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async unbindRunGeneration(sessionId: string, runId: number): Promise<void> {
    this.bindingsLocal.delete(this.bindingMapKey(sessionId, runId));
    const client = this.redis.getClient();
    if (!client) {
      return;
    }
    try {
      await client.hdel(
        sessionRunBindingsKey(sessionId),
        this.bindingField(runId),
      );
    } catch (error) {
      this.logger.warn(
        `session run unbind failed sessionId=${sessionId} runId=${runId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  getBoundRunGenerationLocal(
    sessionId: string,
    runId: number,
  ): number | null {
    return (
      this.bindingsLocal.get(this.bindingMapKey(sessionId, runId)) ?? null
    );
  }

  async setActiveSnapshot(
    sessionId: string,
    snapshot: SessionRunActiveSnapshot,
  ): Promise<void> {
    const client = this.redis.getClient();
    if (!client) {
      return;
    }
    try {
      await client.set(
        sessionRunActiveKey(sessionId),
        JSON.stringify(snapshot),
        'EX',
        ACTIVE_TTL_SEC,
      );
    } catch (error) {
      this.logger.warn(
        `session run active set failed sessionId=${sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async clearActiveSnapshot(sessionId: string): Promise<void> {
    const client = this.redis.getClient();
    if (!client) {
      return;
    }
    try {
      await client.del(sessionRunActiveKey(sessionId));
    } catch {
      // ignore
    }
  }

  async getActiveSnapshot(
    sessionId: string,
  ): Promise<SessionRunActiveSnapshot | null> {
    const client = this.redis.getClient();
    if (!client) {
      return null;
    }
    try {
      const raw = await client.get(sessionRunActiveKey(sessionId));
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as SessionRunActiveSnapshot;
      if (
        typeof parsed.runId !== 'number' ||
        typeof parsed.generation !== 'number'
      ) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  async evictSession(sessionId: string): Promise<void> {
    this.generationLocal.delete(sessionId);
    const prefix = `${sessionId}:`;
    for (const key of this.bindingsLocal.keys()) {
      if (key.startsWith(prefix)) {
        this.bindingsLocal.delete(key);
      }
    }
    const client = this.redis.getClient();
    if (!client) {
      return;
    }
    try {
      await this.releaseDrainLock(sessionId);
      await client.del(
        sessionRunGenerationKey(sessionId),
        sessionRunBindingsKey(sessionId),
        sessionRunActiveKey(sessionId),
        sessionRunQueueKey(sessionId),
        sessionRunDrainLockKey(sessionId),
      );
    } catch (error) {
      this.logger.warn(
        `session run evict redis failed sessionId=${sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
