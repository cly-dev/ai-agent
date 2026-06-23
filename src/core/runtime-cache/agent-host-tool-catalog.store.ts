import { Injectable, Logger } from '@nestjs/common';
import { agentHostToolCatalogKey } from '../memory/redis/redis-keys';
import { RedisConnectionService } from '../memory/redis/redis-connection.service';
import { getRuntimeAgentCatalogTtlSec } from './runtime-cache.constants';
import type { AgentHostToolCatalogSnapshot } from './runtime-cache.types';

@Injectable()
export class AgentHostToolCatalogStore {
  private readonly logger = new Logger(AgentHostToolCatalogStore.name);

  constructor(private readonly redis: RedisConnectionService) {}

  async get(
    appClientId: number,
    agentId: number,
  ): Promise<AgentHostToolCatalogSnapshot | null> {
    const client = this.redis.getClient();
    if (!client) {
      return null;
    }
    const raw = await client.get(agentHostToolCatalogKey(appClientId, agentId));
    if (raw === null) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
      }
      const row = parsed as AgentHostToolCatalogSnapshot;
      if (row.appClientId !== appClientId || row.agentId !== agentId) {
        return null;
      }
      return row;
    } catch {
      this.logger.warn(
        `corrupt host tool catalog cache appClientId=${appClientId} agentId=${agentId}`,
      );
      return null;
    }
  }

  async trySet(
    snapshot: AgentHostToolCatalogSnapshot,
  ): Promise<boolean> {
    const client = this.redis.getClient();
    if (!client) {
      return false;
    }
    await client.set(
      agentHostToolCatalogKey(snapshot.appClientId, snapshot.agentId),
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
    await client.del(agentHostToolCatalogKey(appClientId, agentId));
  }
}
