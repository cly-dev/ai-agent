import { Injectable, Logger } from '@nestjs/common';
import { REDIS_KEY_PREFIX } from '../../core/memory/shared/memory.constants';
import {
  sessionPrepareKey,
  sessionRuntimeKey,
} from '../../core/memory/redis/redis-keys';
import { RedisConnectionService } from '../../core/memory/redis/redis-connection.service';
import { getSessionRuntimeCacheTtlSec } from '../../core/runtime-cache/runtime-cache.constants';
import {
  areSessionRuntimeRevisionsEqual,
  isSessionRuntimeSnapshotValid,
  snapshotContainsAnyToolId,
} from './session-prepare.util';
import type {
  LegacySessionPrepareSnapshot,
  RuntimeRevision,
  SessionAllowedToolsRow,
  SessionHostToolsPageEntry,
  SessionPrepareSkillRow,
  SessionRuntimeSnapshot,
  SessionRuntimeWriteInput,
} from './session-prepare.types';

const SESSION_RUNTIME_SCAN_PATTERN = `${REDIS_KEY_PREFIX}runtime:session:*`;
const LEGACY_PREPARE_SCAN_PATTERN = `${REDIS_KEY_PREFIX}prepare:session:*`;

@Injectable()
export class SessionPrepareStore {
  private readonly logger = new Logger(SessionPrepareStore.name);

  constructor(private readonly redis: RedisConnectionService) {}

  async get(
    sessionId: string,
    userId: number,
    appClientId: number,
    agentId: number,
    expectedRevision?: RuntimeRevision,
  ): Promise<{
    snapshot: SessionRuntimeSnapshot;
    tools: SessionAllowedToolsRow[];
    skills: SessionPrepareSkillRow[];
    hostToolsByPage?: Record<string, SessionHostToolsPageEntry>;
    lastPreparedPage?: string;
    revision: RuntimeRevision;
  } | null> {
    const snapshot = await this.getSnapshot(sessionId);
    if (!snapshot) {
      return null;
    }
    if (
      !isSessionRuntimeSnapshotValid(snapshot, {
        sessionId,
        userId,
        appClientId,
        agentId,
      })
    ) {
      return null;
    }
    if (
      expectedRevision &&
      !areSessionRuntimeRevisionsEqual(snapshot.revision, expectedRevision)
    ) {
      return null;
    }
    return {
      snapshot,
      tools: snapshot.tools as SessionAllowedToolsRow[],
      skills: snapshot.skills,
      hostToolsByPage: snapshot.hostToolsByPage,
      lastPreparedPage: snapshot.lastPreparedPage,
      revision: snapshot.revision,
    };
  }

  async trySet(input: SessionRuntimeWriteInput): Promise<boolean> {
    const client = this.redis.getClient();
    if (!client) {
      return false;
    }
    const existing = await this.getSnapshot(input.sessionId);
    const warmedAt = new Date().toISOString();
    const snapshot: SessionRuntimeSnapshot = {
      schemaVersion: 2,
      sessionId: input.sessionId,
      userId: input.userId,
      appClientId: input.appClientId,
      agentId: input.agentId,
      revision: input.revision,
      tools: input.tools,
      skills: input.skills,
      hostToolsByPage: {
        ...(existing?.hostToolsByPage ?? {}),
        ...(input.hostToolsByPage ?? {}),
      },
      lastPreparedPage: input.lastPreparedPage ?? existing?.lastPreparedPage,
      warmedAt,
    };
    const ttl = getSessionRuntimeCacheTtlSec();
    await client.set(
      sessionRuntimeKey(input.sessionId),
      JSON.stringify(snapshot),
      'EX',
      ttl,
    );
    await client.del(sessionPrepareKey(input.sessionId));
    return true;
  }

  async delete(sessionId: string): Promise<void> {
    const client = this.redis.getClient();
    if (!client) {
      return;
    }
    await client.del(sessionRuntimeKey(sessionId), sessionPrepareKey(sessionId));
  }

  async invalidateSnapshotsContainingToolIds(
    toolIds: number[],
  ): Promise<number> {
    if (toolIds.length === 0) {
      return 0;
    }
    const [runtimeRemoved, legacyRemoved] = await Promise.all([
      this.scanAndInvalidate(SESSION_RUNTIME_SCAN_PATTERN, (snapshot) =>
        snapshotContainsAnyToolId(
          snapshot.tools as Array<{ id: number }>,
          toolIds,
        ),
      ),
      this.scanAndInvalidate(LEGACY_PREPARE_SCAN_PATTERN, (snapshot) =>
        snapshotContainsAnyToolId(
          snapshot.tools as Array<{ id: number }>,
          toolIds,
        ),
      ),
    ]);
    const removed = runtimeRemoved + legacyRemoved;
    if (removed > 0) {
      this.logger.log(
        `invalidated ${removed} session runtime snapshot(s) for toolIds=${toolIds.join(',')}`,
      );
    }
    return removed;
  }

  async invalidateSnapshotsForAgent(agentId: number): Promise<string[]> {
    const sessionIds = new Set<string>();
    const [runtimeRemoved, legacyRemoved] = await Promise.all([
      this.scanAndInvalidate(
        SESSION_RUNTIME_SCAN_PATTERN,
        (snapshot) => snapshot.agentId === agentId,
        sessionIds,
      ),
      this.scanAndInvalidate(
        LEGACY_PREPARE_SCAN_PATTERN,
        (snapshot) => snapshot.agentId === agentId,
        sessionIds,
      ),
    ]);
    const removed = runtimeRemoved + legacyRemoved;
    if (removed > 0) {
      this.logger.log(
        `invalidated ${removed} session runtime snapshot(s) for agentId=${agentId}`,
      );
    }
    return [...sessionIds];
  }

  private async scanAndInvalidate(
    pattern: string,
    shouldDelete: (snapshot: SessionRuntimeSnapshot) => boolean,
    collectedSessionIds?: Set<string>,
  ): Promise<number> {
    const client = this.redis.getClient();
    if (!client) {
      return 0;
    }
    let removed = 0;
    let cursor = '0';
    do {
      const [nextCursor, keys] = await client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;
      for (const key of keys) {
        const sessionId = this.readSessionIdFromKey(key);
        if (!sessionId) {
          continue;
        }
        const snapshot = await this.getSnapshot(sessionId);
        if (snapshot && shouldDelete(snapshot)) {
          await client.del(key);
          collectedSessionIds?.add(sessionId);
          removed += 1;
        }
      }
    } while (cursor !== '0');
    return removed;
  }

  private readSessionIdFromKey(key: string): string | null {
    const prefixes = [
      `${REDIS_KEY_PREFIX}runtime:session:`,
      `${REDIS_KEY_PREFIX}prepare:session:`,
    ];
    for (const prefix of prefixes) {
      if (key.startsWith(prefix)) {
        const sessionId = key.slice(prefix.length);
        return sessionId.length > 0 ? sessionId : null;
      }
    }
    return null;
  }

  private async getSnapshot(
    sessionId: string,
  ): Promise<SessionRuntimeSnapshot | null> {
    const client = this.redis.getClient();
    if (!client) {
      return null;
    }
    for (const keyFn of [sessionRuntimeKey, sessionPrepareKey]) {
      const raw = await client.get(keyFn(sessionId));
      if (raw === null) {
        continue;
      }
      const normalized = this.normalizeSnapshot(raw, sessionId);
      if (normalized) {
        return normalized;
      }
    }
    return null;
  }

  private normalizeSnapshot(
    raw: string,
    sessionId: string,
  ): SessionRuntimeSnapshot | null {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
      }
      const row = parsed as LegacySessionPrepareSnapshot | SessionRuntimeSnapshot;
      if (row.sessionId !== sessionId) {
        return null;
      }
      if (
        'schemaVersion' in row &&
        row.schemaVersion === 2 &&
        'revision' in row &&
        row.revision
      ) {
        return row;
      }
      return this.upgradeLegacySnapshot(row as LegacySessionPrepareSnapshot);
    } catch {
      this.logger.warn(`corrupt session runtime cache sessionId=${sessionId}`);
      return null;
    }
  }

  private upgradeLegacySnapshot(
    legacy: LegacySessionPrepareSnapshot,
  ): SessionRuntimeSnapshot {
    return {
      schemaVersion: 2,
      sessionId: legacy.sessionId,
      userId: legacy.userId,
      appClientId: legacy.appClientId,
      agentId: legacy.agentId,
      revision: {
        tools: legacy.toolIdsFingerprint,
        skills: legacy.skillIdsFingerprint,
        hostTools: '',
        integrations: '',
      },
      tools: legacy.tools,
      skills: legacy.skills,
      warmedAt: legacy.warmedAt,
    };
  }
}
