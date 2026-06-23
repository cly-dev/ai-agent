import { Injectable, Logger } from '@nestjs/common';
import {
  agentSkillCatalogKey,
  agentSkillCatalogScanPattern,
} from '../memory/redis/redis-keys';
import { RedisConnectionService } from '../memory/redis/redis-connection.service';
import { getRuntimeAgentCatalogTtlSec } from './runtime-cache.constants';
import type { AgentSkillCatalogSnapshot } from './runtime-cache.types';

@Injectable()
export class AgentSkillCatalogStore {
  private readonly logger = new Logger(AgentSkillCatalogStore.name);

  constructor(private readonly redis: RedisConnectionService) {}

  async get(
    appClientId: number,
    agentId: number,
    roleId: number,
  ): Promise<AgentSkillCatalogSnapshot | null> {
    const client = this.redis.getClient();
    if (!client) {
      return null;
    }
    const raw = await client.get(
      agentSkillCatalogKey(appClientId, agentId, roleId),
    );
    if (raw === null) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
      }
      const row = parsed as AgentSkillCatalogSnapshot;
      if (
        row.appClientId !== appClientId ||
        row.agentId !== agentId ||
        row.roleId !== roleId
      ) {
        return null;
      }
      if (!Array.isArray(row.skills)) {
        return null;
      }
      return row;
    } catch {
      this.logger.warn(
        `corrupt skill catalog cache appClientId=${appClientId} agentId=${agentId} roleId=${roleId}`,
      );
      return null;
    }
  }

  async trySet(snapshot: AgentSkillCatalogSnapshot): Promise<boolean> {
    const client = this.redis.getClient();
    if (!client) {
      return false;
    }
    await client.set(
      agentSkillCatalogKey(snapshot.appClientId, snapshot.agentId, snapshot.roleId),
      JSON.stringify(snapshot),
      'EX',
      getRuntimeAgentCatalogTtlSec(),
    );
    return true;
  }

  async deleteForAgent(appClientId: number, agentId: number): Promise<number> {
    const client = this.redis.getClient();
    if (!client) {
      return 0;
    }
    const pattern = agentSkillCatalogScanPattern(appClientId, agentId);
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
      if (keys.length > 0) {
        await client.del(...keys);
        removed += keys.length;
      }
    } while (cursor !== '0');
    if (removed > 0) {
      this.logger.debug(
        `deleted ${removed} skill catalog key(s) agentId=${agentId}`,
      );
    }
    return removed;
  }
}
