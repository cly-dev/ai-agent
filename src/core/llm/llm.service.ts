import { Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import type { LlmModelConfig } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { LlmAdapter } from './adapters/llm-adapter.interface';
import { LLM_ADAPTER } from './adapters/llm-adapter.interface';
import type { LlmChatInput, LlmChatRequest } from './llm.types';

@Injectable()
export class LlmService implements OnModuleInit {
  private cachedConfig: LlmModelConfig | null = null;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(LLM_ADAPTER) private readonly adapter: LlmAdapter,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.refreshConfigCache();
  }

  async refreshConfigCache(): Promise<void> {
    this.cachedConfig = await this.loadActiveConfigFromDb();
  }

  async chat(input: LlmChatInput) {
    const config = await this.getCachedConfig();
    const request: LlmChatRequest = {
      model: config.model,
      messages: input.messages,
      tools: input.tools,
      parameters: input.parameters ?? this.normalizeParameters(config.parameters),
      stream: input.stream ?? config.stream,
      maxTokens: input.maxTokens ?? config.maxTokens ?? undefined,
      temperature: input.temperature ?? config.temperature ?? undefined,
    };
    return this.adapter.chat(request, {
      baseUrl: config.baseUrl,
      chatPath: config.chatPath,
      apiKey: config.apiKey,
    });
  }

  private async getCachedConfig(): Promise<LlmModelConfig> {
    if (this.cachedConfig && this.cachedConfig.enabled) {
      return this.cachedConfig;
    }
    this.cachedConfig = await this.loadActiveConfigFromDb();
    return this.cachedConfig;
  }

  private async loadActiveConfigFromDb(): Promise<LlmModelConfig> {
    const config = await this.prisma.llmModelConfig.findFirst({
      where: { enabled: true },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
    if (!config) {
      throw new NotFoundException('no enabled llm model config found');
    }
    return config;
  }

  private normalizeParameters(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    return value as Record<string, unknown>;
  }
}
