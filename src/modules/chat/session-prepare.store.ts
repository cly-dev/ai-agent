import { Injectable, Logger } from '@nestjs/common';
import { sessionPrepareKey } from '../../core/memory/redis/redis-keys';
import { RedisConnectionService } from '../../core/memory/redis/redis-connection.service';
import { getSessionPrepareCacheTtlSec } from './session-prepare.constants';
import {
  buildToolIdsFingerprint,
  isSessionPrepareSnapshotValid,
} from './session-prepare.util';
import type {
  SessionAllowedToolsRow,
  SessionPrepareSnapshot,
} from './session-prepare.types';

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
