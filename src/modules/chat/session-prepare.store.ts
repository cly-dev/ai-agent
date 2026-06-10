import { Injectable, Logger } from '@nestjs/common';
import { REDIS_KEY_PREFIX } from '../../core/memory/shared/memory.constants';
import { sessionPrepareKey } from '../../core/memory/redis/redis-keys';
import { RedisConnectionService } from '../../core/memory/redis/redis-connection.service';
import { getSessionPrepareCacheTtlSec } from './session-prepare.constants';
import {
  buildToolIdsFingerprint,
  isSessionPrepareSnapshotValid,
  snapshotContainsAnyToolId,
} from './session-prepare.util';
import type {
  SessionAllowedToolsRow,
  SessionPrepareSnapshot,
} from './session-prepare.types';

const SESSION_PREPARE_SCAN_PATTERN = `${REDIS_KEY_PREFIX}prepare:session:*`;

@Injectable()
export class SessionPrepareStore {
  private readonly logger = new Logger(SessionPrepareStore.name);

  constructor(private readonly redis: RedisConnectionService) {}

  async get(
    sessionId: string,
    userId: number,
    appClientId: number,
    agentId: number,
  ): Promise<SessionAllowedToolsRow[] | null> {
    const snapshot = await this.getSnapshot(sessionId);
    if (!snapshot) {
      return null;
    }
    if (
      !isSessionPrepareSnapshotValid(snapshot, {
        sessionId,
        userId,
        appClientId,
        agentId,
      })
    ) {
      return null;
    }
    const fingerprint = buildToolIdsFingerprint(snapshot.tools);
    if (fingerprint !== snapshot.toolIdsFingerprint) {
      return null;
    }
    return snapshot.tools;
  }

  async trySet(
    sessionId: string,
    userId: number,
    appClientId: number,
    agentId: number,
    tools: SessionAllowedToolsRow[],
  ): Promise<boolean> {
    const client = this.redis.getClient();
    if (!client) {
      return false;
    }
    const warmedAt = new Date().toISOString();
    const snapshot: SessionPrepareSnapshot = {
      sessionId,
      userId,
      appClientId,
      agentId,
      toolIdsFingerprint: buildToolIdsFingerprint(tools),
      tools,
      warmedAt,
    };
    await client.set(
      sessionPrepareKey(sessionId),
      JSON.stringify(snapshot),
      'EX',
      getSessionPrepareCacheTtlSec(),
    );
    return true;
  }

  async delete(sessionId: string): Promise<void> {
    const client = this.redis.getClient();
    if (!client) {
      return;
    }
    await client.del(sessionPrepareKey(sessionId));
  }

  /** Drop Redis prepare snapshots that still reference disabled/removed tools. */
  async invalidateSnapshotsContainingToolIds(
    toolIds: number[],
  ): Promise<number> {
    if (toolIds.length === 0) {
      return 0;
    }
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
        SESSION_PREPARE_SCAN_PATTERN,
        'COUNT',
        100,
      );
      cursor = nextCursor;
      for (const key of keys) {
        const sessionId = this.readSessionIdFromPrepareKey(key);
        if (!sessionId) {
          continue;
        }
        const snapshot = await this.getSnapshot(sessionId);
        if (
          snapshot &&
          snapshotContainsAnyToolId(snapshot.tools, toolIds)
        ) {
          await client.del(key);
          removed += 1;
        }
      }
    } while (cursor !== '0');

    if (removed > 0) {
      this.logger.log(
        `invalidated ${removed} session prepare cache(s) for toolIds=${toolIds.join(',')}`,
      );
    }
    return removed;
  }

  /** Drop Redis prepare snapshots for a given agent (binding / enable changes). */
  async invalidateSnapshotsForAgent(agentId: number): Promise<number> {
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
        SESSION_PREPARE_SCAN_PATTERN,
        'COUNT',
        100,
      );
      cursor = nextCursor;
      for (const key of keys) {
        const sessionId = this.readSessionIdFromPrepareKey(key);
        if (!sessionId) {
          continue;
        }
        const snapshot = await this.getSnapshot(sessionId);
        if (snapshot?.agentId === agentId) {
          await client.del(key);
          removed += 1;
        }
      }
    } while (cursor !== '0');

    return removed;
  }

  private readSessionIdFromPrepareKey(key: string): string | null {
    const prefix = `${REDIS_KEY_PREFIX}prepare:session:`;
    if (!key.startsWith(prefix)) {
      return null;
    }
    const sessionId = key.slice(prefix.length);
    return sessionId.length > 0 ? sessionId : null;
  }

  private async getSnapshot(
    sessionId: string,
  ): Promise<SessionPrepareSnapshot | null> {
    const client = this.redis.getClient();
    if (!client) {
      return null;
    }
    const raw = await client.get(sessionPrepareKey(sessionId));
    if (raw === null) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
      }
      const snapshot = parsed as SessionPrepareSnapshot;
      if (snapshot.sessionId !== sessionId) {
        return null;
      }
      return snapshot;
    } catch {
      this.logger.warn(`corrupt session prepare cache sessionId=${sessionId}`);
      return null;
    }
  }
}
