import { Injectable, Logger } from '@nestjs/common';
import { RedisConnectionService } from '../memory/redis/redis-connection.service';
import { intentRecallConfigKey } from '../memory/redis/redis-keys';
import { getIntentRecallConfigCacheTtlSec } from './intent-recall-config-cache.constants';
import type {
  IntentRecallMode,
  ResolvedIntentRecallConfig,
} from './intent-recall-config.types';

@Injectable()
export class IntentRecallConfigCacheStore {
  private readonly logger = new Logger(IntentRecallConfigCacheStore.name);

  constructor(private readonly redis: RedisConnectionService) {}

  async get(): Promise<ResolvedIntentRecallConfig | null> {
    const client = this.redis.getClient();
    if (!client) {
      return null;
    }
    const raw = await client.get(intentRecallConfigKey());
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
        typeof row.recallMode !== 'string' ||
        typeof row.vectorTopK !== 'number' ||
        typeof row.vectorMinScore !== 'number' ||
        typeof row.bindToolsMax !== 'number' ||
        typeof row.fallbackToKeyword !== 'boolean'
      ) {
        return null;
      }
      const mode = row.recallMode as string;
      if (mode !== 'auto' && mode !== 'vector' && mode !== 'keyword') {
        return null;
      }
      return {
        recallMode: mode as IntentRecallMode,
        vectorTopK: row.vectorTopK,
        vectorMinScore: row.vectorMinScore,
        bindToolsMax: row.bindToolsMax,
        fallbackToKeyword: row.fallbackToKeyword,
        source: 'database',
      };
    } catch {
      this.logger.warn('corrupt intent recall config cache');
      return null;
    }
  }

  async trySet(config: ResolvedIntentRecallConfig): Promise<boolean> {
    const client = this.redis.getClient();
    if (!client) {
      return false;
    }
    await client.set(
      intentRecallConfigKey(),
      JSON.stringify(config),
      'EX',
      getIntentRecallConfigCacheTtlSec(),
    );
    return true;
  }

  async delete(): Promise<void> {
    const client = this.redis.getClient();
    if (!client) {
      return;
    }
    await client.del(intentRecallConfigKey());
  }
}
