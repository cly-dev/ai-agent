import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { getDefaultSessionContextTtlSec } from '../shared/memory.constants';
import { RedisConnectionService } from '../redis/redis-connection.service';
import { sessionGoaCacheKey } from '../redis/redis-keys';
import { SessionContextStore } from '../context/session-context.store';
import { SessionGoaReplayService } from './session-goa-replay.service';
import { isSessionContextPayload } from '../context/session-context.types';
import { stripLegacyGoaFieldsFromContext } from './session-goa-legacy-cleanup.util';
import {
  migrateLegacyContextToGoa,
  type LegacySessionContextPayload,
} from './session-goa-migrate.util';
import {
  createEmptySessionGoaPayload,
  isSessionGoaPayload,
  type SessionGoaPayload,
} from './session-goa.types';

@Injectable()
export class SessionGoaStore {
  private readonly logger = new Logger(SessionGoaStore.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisConnectionService,
    private readonly sessionContextStore: SessionContextStore,
    private readonly replayService: SessionGoaReplayService,
  ) {}

  /**
   * 只读：DB 权威；校验 Redis 缓存 updatedAt，不一致则刷新缓存。
   * 不触发 migrate / replay。
   */
  async get(sessionId: string): Promise<SessionGoaPayload> {
    const fromDb = await this.readFromDb(sessionId);
    if (fromDb) {
      await this.syncCacheFromDb(sessionId, fromDb);
      return fromDb;
    }
    await this.invalidateCache(sessionId);
    return createEmptySessionGoaPayload(sessionId);
  }

  /**
   * 冷启动：legacy 迁移 → AgentRun replay → 写入 DB；已有 DB 行则直接返回。
   */
  async warm(sessionId: string): Promise<SessionGoaPayload> {
    const fromDb = await this.readFromDb(sessionId);
    if (fromDb) {
      await this.syncCacheFromDb(sessionId, fromDb);
      return fromDb;
    }

    const migrated = await this.migrateFromLegacyRedis(sessionId);
    if (migrated) {
      await this.save(sessionId, migrated);
      return migrated;
    }

    const replayed = await this.replayService.replay(sessionId);
    if (replayed) {
      await this.save(sessionId, replayed);
      return replayed;
    }

    const empty = createEmptySessionGoaPayload(sessionId);
    await this.syncCacheFromDb(sessionId, empty);
    return empty;
  }

  async save(sessionId: string, payload: SessionGoaPayload): Promise<void> {
    const body: SessionGoaPayload = {
      ...payload,
      sessionId,
      updatedAt: new Date().toISOString(),
    };
    await this.prisma.sessionGoaMemory.upsert({
      where: { sessionId },
      create: {
        sessionId,
        payload: body as unknown as Prisma.InputJsonValue,
      },
      update: {
        payload: body as unknown as Prisma.InputJsonValue,
      },
    });
    await this.writeCache(sessionId, body);
  }

  /**
   * 乐观锁写入：DB 行存在且 payload.updatedAt 与读取时不一致则返回 false。
   */
  async saveIfUnchanged(
    sessionId: string,
    payload: SessionGoaPayload,
    expectedUpdatedAt: string,
  ): Promise<boolean> {
    const row = await this.prisma.sessionGoaMemory.findUnique({
      where: { sessionId },
      select: { payload: true },
    });
    if (row?.payload && isSessionGoaPayload(row.payload)) {
      if (row.payload.updatedAt !== expectedUpdatedAt) {
        return false;
      }
    }
    await this.save(sessionId, payload);
    return true;
  }

  async delete(sessionId: string): Promise<void> {
    await this.prisma.sessionGoaMemory.deleteMany({ where: { sessionId } });
    await this.invalidateCache(sessionId);
  }

  private async readFromDb(
    sessionId: string,
  ): Promise<SessionGoaPayload | null> {
    const row = await this.prisma.sessionGoaMemory.findUnique({
      where: { sessionId },
      select: { payload: true },
    });
    if (!row?.payload || !isSessionGoaPayload(row.payload)) {
      return null;
    }
    if (row.payload.sessionId !== sessionId) {
      this.logger.warn(
        `session GOA payload sessionId mismatch expected=${sessionId} got=${row.payload.sessionId}`,
      );
      return null;
    }
    return row.payload;
  }

  private async syncCacheFromDb(
    sessionId: string,
    fromDb: SessionGoaPayload,
  ): Promise<void> {
    const cached = await this.readCache(sessionId);
    if (!cached || cached.updatedAt !== fromDb.updatedAt) {
      await this.writeCache(sessionId, fromDb);
    }
  }

  private async migrateFromLegacyRedis(
    sessionId: string,
  ): Promise<SessionGoaPayload | null> {
    const raw = await this.sessionContextStore.get(sessionId);
    if (!raw || !isSessionContextPayload(raw)) {
      return null;
    }
    const legacy = raw as LegacySessionContextPayload;
    const hasLegacyGoa =
      (Array.isArray(legacy.recentEpisodes) && legacy.recentEpisodes.length > 0) ||
      (Array.isArray(legacy.sessionArtifacts) && legacy.sessionArtifacts.length > 0) ||
      legacy.taskState != null ||
      legacy.resumeTaskPlan != null ||
      (Array.isArray(legacy.observationSnapshots) &&
        legacy.observationSnapshots.length > 0) ||
      legacy.workingMemory != null;
    if (!hasLegacyGoa) {
      return null;
    }
    this.logger.log(`migrating legacy GOA from redis sessionId=${sessionId}`);
    const migrated = migrateLegacyContextToGoa(sessionId, legacy);
    await this.sessionContextStore.tryPatchMerge(sessionId, (current) =>
      stripLegacyGoaFieldsFromContext(current),
    );
    return migrated;
  }

  private async readCache(sessionId: string): Promise<SessionGoaPayload | null> {
    const client = this.redis.getClient();
    if (!client) {
      return null;
    }
    const raw = await client.get(sessionGoaCacheKey(sessionId));
    if (!raw) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isSessionGoaPayload(parsed) && parsed.sessionId === sessionId) {
        return parsed;
      }
    } catch {
      return null;
    }
    return null;
  }

  private async writeCache(
    sessionId: string,
    payload: SessionGoaPayload,
  ): Promise<void> {
    const client = this.redis.getClient();
    if (!client) {
      return;
    }
    const ttl = getDefaultSessionContextTtlSec();
    await client.set(
      sessionGoaCacheKey(sessionId),
      JSON.stringify(payload),
      'EX',
      ttl,
    );
  }

  private async invalidateCache(sessionId: string): Promise<void> {
    const client = this.redis.getClient();
    if (!client) {
      return;
    }
    await client.del(sessionGoaCacheKey(sessionId));
  }
}
