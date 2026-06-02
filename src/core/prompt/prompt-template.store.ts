import { Injectable, Logger } from '@nestjs/common';
import { RedisConnectionService } from '../memory/redis/redis-connection.service';
import { promptTemplateActiveKey } from './redis/prompt-template-keys';
import type { ResolvedPrompt } from './prompt-registry.types';

type StoredPromptPayload = ResolvedPrompt;

@Injectable()
export class PromptTemplateStore {
  private readonly logger = new Logger(PromptTemplateStore.name);

  constructor(private readonly redis: RedisConnectionService) {}

  isAvailable(): boolean {
    return this.redis.getClient() != null;
  }

  async get(
    key: string,
    appClientId: number | null | undefined,
    agentId: number | null | undefined,
    locale: string,
  ): Promise<ResolvedPrompt | null> {
    const client = this.redis.getClient();
    if (!client) {
      return null;
    }
    const redisKey = promptTemplateActiveKey(key, appClientId, agentId, locale);
    const raw = await client.get(redisKey);
    if (raw === null) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
      }
      const row = parsed as StoredPromptPayload;
      if (typeof row.content !== 'string' || typeof row.key !== 'string') {
        return null;
      }
      return row;
    } catch {
      this.logger.warn(`corrupt prompt cache JSON key=${redisKey}`);
      return null;
    }
  }

  async set(
    key: string,
    appClientId: number | null | undefined,
    agentId: number | null | undefined,
    locale: string,
    resolved: ResolvedPrompt,
  ): Promise<void> {
    const client = this.redis.getClient();
    if (!client) {
      return;
    }
    const redisKey = promptTemplateActiveKey(key, appClientId, agentId, locale);
    await client.set(redisKey, JSON.stringify(resolved));
  }

  async delete(
    key: string,
    appClientId: number | null | undefined,
    agentId: number | null | undefined,
    locale: string,
  ): Promise<void> {
    const client = this.redis.getClient();
    if (!client) {
      return;
    }
    await client.del(promptTemplateActiveKey(key, appClientId, agentId, locale));
  }
}
