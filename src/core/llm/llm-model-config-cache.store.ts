import { Injectable, Logger } from '@nestjs/common';
import type {
  LlmModelConfig,
  LlmModelKind,
  Prisma,
} from '../../../generated/prisma/client';
import { RedisConnectionService } from '../memory/redis/redis-connection.service';
import { llmModelConfigActiveKey } from '../memory/redis/redis-keys';
import { getLlmModelConfigCacheTtlSec } from './llm-model-config-cache.constants';

type LlmModelConfigCachePayload = {
  id: number;
  kind: LlmModelKind;
  provider: string;
  model: string;
  apiKey: string | null;
  baseUrl: string;
  chatPath: string;
  parameters: unknown;
  stream: boolean;
  maxTokens: number | null;
  temperature: number | null;
  enabled: boolean;
};

@Injectable()
export class LlmModelConfigCacheStore {
  private readonly logger = new Logger(LlmModelConfigCacheStore.name);

  constructor(private readonly redis: RedisConnectionService) {}

  async getActive(kind: LlmModelKind): Promise<LlmModelConfig | null> {
    const client = this.redis.getClient();
    if (!client) {
      return null;
    }
    const raw = await client.get(llmModelConfigActiveKey(kind));
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
        typeof row.kind !== 'string' ||
        typeof row.provider !== 'string' ||
        typeof row.model !== 'string' ||
        typeof row.baseUrl !== 'string' ||
        typeof row.chatPath !== 'string' ||
        typeof row.stream !== 'boolean' ||
        typeof row.enabled !== 'boolean'
      ) {
        return null;
      }
      return {
        id: row.id as number,
        kind: row.kind as LlmModelKind,
        singletonKey: null,
        provider: row.provider as string,
        model: row.model as string,
        apiKey: (row.apiKey as string | null) ?? null,
        baseUrl: row.baseUrl as string,
        chatPath: row.chatPath as string,
        parameters: (row.parameters ?? null) as Prisma.JsonValue,
        stream: row.stream as boolean,
        maxTokens: (row.maxTokens as number | null) ?? null,
        temperature: (row.temperature as number | null) ?? null,
        enabled: row.enabled as boolean,
        createdAt: new Date(0),
        updatedAt: new Date(0),
      };
    } catch {
      this.logger.warn(`corrupt llm model config cache kind=${kind}`);
      return null;
    }
  }

  async trySetActive(config: LlmModelConfig): Promise<boolean> {
    const client = this.redis.getClient();
    if (!client) {
      return false;
    }
    const payload: LlmModelConfigCachePayload = {
      id: config.id,
      kind: config.kind,
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      chatPath: config.chatPath,
      parameters: config.parameters,
      stream: config.stream,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      enabled: config.enabled,
    };
    await client.set(
      llmModelConfigActiveKey(config.kind),
      JSON.stringify(payload),
      'EX',
      getLlmModelConfigCacheTtlSec(),
    );
    return true;
  }

  async deleteActive(kind: LlmModelKind): Promise<void> {
    const client = this.redis.getClient();
    if (!client) {
      return;
    }
    await client.del(llmModelConfigActiveKey(kind));
  }
}
