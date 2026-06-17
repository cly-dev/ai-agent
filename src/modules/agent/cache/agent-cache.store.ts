import { Injectable, Logger } from '@nestjs/common';
import { agentRuntimeKey } from '../../../core/memory/redis/redis-keys';
import { RedisConnectionService } from '../../../core/memory/redis/redis-connection.service';
import { getAgentRuntimeCacheTtlSec } from './agent-cache.constants';
import type { AgentRuntimeSnapshot } from './agent-runtime.types';

@Injectable()
export class AgentCacheStore {
  private readonly logger = new Logger(AgentCacheStore.name);

  constructor(private readonly redis: RedisConnectionService) {}

  async get(
    appClientId: number,
    agentId: number,
  ): Promise<AgentRuntimeSnapshot | null> {
    const client = this.redis.getClient();
    if (!client) {
      return null;
    }
    const raw = await client.get(agentRuntimeKey(appClientId, agentId));
    if (raw === null) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
      }
      const row = parsed as Record<string, unknown>;
      if (
        typeof row.id !== 'number' ||
        typeof row.appClientId !== 'number' ||
        typeof row.name !== 'string' ||
        typeof row.systemPrompt !== 'string' ||
        typeof row.maxSteps !== 'number' ||
        typeof row.enableToolCall !== 'boolean'
      ) {
        return null;
      }
      return {
        id: row.id,
        appClientId: row.appClientId,
        name: row.name,
        systemPrompt: row.systemPrompt,
        maxSteps: row.maxSteps,
        enableToolCall: row.enableToolCall,
        config: row.config ?? null,
      };
    } catch {
      this.logger.warn(
        `corrupt agent runtime cache appClientId=${appClientId} agentId=${agentId}`,
      );
      return null;
    }
  }

  /** Cache-aside write after DB load; no-op when Redis unavailable. */
  async trySet(
    appClientId: number,
    agentId: number,
    snapshot: AgentRuntimeSnapshot,
  ): Promise<boolean> {
    const client = this.redis.getClient();
    if (!client) {
      return false;
    }
    const ttl = getAgentRuntimeCacheTtlSec();
    await client.set(
      agentRuntimeKey(appClientId, agentId),
      JSON.stringify(snapshot),
      'EX',
      ttl,
    );
    return true;
  }

  async delete(appClientId: number, agentId: number): Promise<void> {
    const client = this.redis.getClient();
    if (!client) {
      return;
    }
    await client.del(agentRuntimeKey(appClientId, agentId));
  }
}
