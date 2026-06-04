import { Injectable, Logger } from '@nestjs/common';
import { pendingWriteConfirmationKey } from '../../core/memory/redis/redis-keys';
import { RedisConnectionService } from '../../core/memory/redis/redis-connection.service';
import type { PendingWriteConfirmationSnapshot } from './pending-write-confirmation.types';

const TTL_SEC = 30 * 60;

@Injectable()
export class PendingWriteConfirmationStore {
  private readonly logger = new Logger(PendingWriteConfirmationStore.name);
  private readonly memory = new Map<string, PendingWriteConfirmationSnapshot>();

  constructor(private readonly redis: RedisConnectionService) {}

  async set(snapshot: PendingWriteConfirmationSnapshot): Promise<void> {
    const key = pendingWriteConfirmationKey(snapshot.sessionId);
    const payload = JSON.stringify(snapshot);
    const client = this.redis.getClient();
    if (client) {
      try {
        await client.set(key, payload, 'EX', TTL_SEC);
        return;
      } catch (error) {
        this.logger.warn(
          `pending write confirmation redis set failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
    this.memory.set(key, snapshot);
  }

  async get(
    sessionId: string,
    userId: number,
  ): Promise<PendingWriteConfirmationSnapshot | null> {
    const key = pendingWriteConfirmationKey(sessionId);
    const client = this.redis.getClient();
    if (client) {
      try {
        const raw = await client.get(key);
        if (raw) {
          return this.parseAndValidate(raw, sessionId, userId);
        }
      } catch (error) {
        this.logger.warn(
          `pending write confirmation redis get failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
    const cached = this.memory.get(key);
    if (!cached) {
      return null;
    }
    return cached.userId === userId ? cached : null;
  }

  async consume(
    sessionId: string,
    userId: number,
  ): Promise<PendingWriteConfirmationSnapshot | null> {
    const snapshot = await this.get(sessionId, userId);
    if (!snapshot) {
      return null;
    }
    await this.clear(sessionId);
    return snapshot;
  }

  async clear(sessionId: string): Promise<void> {
    const key = pendingWriteConfirmationKey(sessionId);
    const client = this.redis.getClient();
    if (client) {
      try {
        await client.del(key);
      } catch {
        // ignore
      }
    }
    this.memory.delete(key);
  }

  private parseAndValidate(
    raw: string,
    sessionId: string,
    userId: number,
  ): PendingWriteConfirmationSnapshot | null {
    try {
      const parsed = JSON.parse(raw) as PendingWriteConfirmationSnapshot;
      if (
        parsed.sessionId !== sessionId ||
        parsed.userId !== userId ||
        !Array.isArray(parsed.toolCalls)
      ) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
}
