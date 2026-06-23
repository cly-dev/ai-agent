import { Injectable, Logger } from '@nestjs/common';
import { agentToolCatalogKey } from '../memory/redis/redis-keys';
import { RedisConnectionService } from '../memory/redis/redis-connection.service';
import { getRuntimeAgentCatalogTtlSec } from './runtime-cache.constants';
import type { AgentToolCatalogSnapshot } from './runtime-cache.types';

@Injectable()
export class AgentToolCatalogStore {
  private readonly logger = new Logger(AgentToolCatalogStore.name);

  constructor(private readonly redis: RedisConnectionService) {}

  async get(
    appClientId: number,
    agentId: number,
  ): Promise<AgentToolCatalogSnapshot | null> {
    const client = this.redis.getClient();
    if (!client) {
      return null;
    }
    const raw = await client.get(agentToolCatalogKey(appClientId, agentId));
    if (raw === null) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
      }
      const row = parsed as AgentToolCatalogSnapshot;
      if (row.appClientId !== appClientId || row.agentId !== agentId) {
        return null;
      }
      if (!Array.isArray(row.tools) || !Array.isArray(row.agentBoundToolIds)) {
        return null;
      }
      return row;
    } catch {
      this.logger.warn(
        `corrupt tool catalog cache appClientId=${appClientId} agentId=${agentId}`,
      );
      return null;
    }
  }

  async trySet(snapshot: AgentToolCatalogSnapshot): Promise<boolean> {
    const client = this.redis.getClient();
    if (!client) {
      return false;
    }
    await client.set(
      agentToolCatalogKey(snapshot.appClientId, snapshot.agentId),
      JSON.stringify(snapshot),
      'EX',
      getRuntimeAgentCatalogTtlSec(),
    );
    return true;
  }

  async delete(appClientId: number, agentId: number): Promise<void> {
    const client = this.redis.getClient();
    if (!client) {
      return;
    }
    await client.del(agentToolCatalogKey(appClientId, agentId));
  }
}
