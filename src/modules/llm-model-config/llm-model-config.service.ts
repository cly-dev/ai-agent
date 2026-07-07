import { Injectable, NotFoundException } from '@nestjs/common';
import {
  LlmModelKind,
  Prisma,
  type IntentRecallConfig,
  type LlmModelConfig,
} from '../../../generated/prisma/client';
import { IntentRecallConfigService } from '../../core/intent/intent-recall-config.service';
import { LlmService } from '../../core/llm/llm.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { UpdateIntentRecallConfigDto } from './dto/update-intent-recall-config.dto';
import type { UpdateLlmModelConfigDto } from './dto/update-llm-model-config.dto';
import type { UpsertLlmModelConfigDto } from './dto/upsert-llm-model-config.dto';

@Injectable()
export class LlmModelConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
    private readonly intentRecallConfig: IntentRecallConfigService,
  ) {}

  findAll(): Promise<LlmModelConfig[]> {
    return this.prisma.llmModelConfig.findMany({
      orderBy: [{ kind: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  async findByKind(kind: LlmModelKind): Promise<LlmModelConfig[]> {
    const rows = await this.prisma.llmModelConfig.findMany({
      where: { kind },
      orderBy: [{ enabled: 'desc' }, { updatedAt: 'desc' }, { id: 'desc' }],
    });
    if (rows.length === 0) {
      throw new NotFoundException(`llm model config kind=${kind} not found`);
    }
    return rows;
  }

  async create(dto: UpsertLlmModelConfigDto): Promise<LlmModelConfig> {
    const row = await this.prisma.$transaction(async (tx) => {
      const nextEnabled = dto.enabled ?? true;
      if (nextEnabled) {
        await tx.llmModelConfig.updateMany({
          where: { kind: dto.kind, enabled: true },
          data: { enabled: false },
        });
      }
      return tx.llmModelConfig.create({
        data: {
          kind: dto.kind,
          provider: dto.provider ?? this.defaultProvider(dto.kind),
          model: dto.model,
          apiKey: dto.apiKey ?? null,
          baseUrl: dto.baseUrl,
          chatPath: dto.chatPath ?? '/v1/chat/completions',
          parameters: (dto.parameters ?? undefined) as Prisma.InputJsonValue | undefined,
          stream: dto.stream ?? false,
          maxTokens: dto.maxTokens ?? null,
          temperature: dto.temperature ?? null,
          enabled: nextEnabled,
        },
      });
    });
    await this.llmService.refreshConfigCache();
    return row;
  }

  async update(id: number, dto: UpdateLlmModelConfigDto): Promise<LlmModelConfig> {
    const existing = await this.prisma.llmModelConfig.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`llm model config id=${id} not found`);
    }
    const row = await this.prisma.$transaction(async (tx) => {
      if (dto.enabled === true) {
        await tx.llmModelConfig.updateMany({
          where: { kind: existing.kind, enabled: true, id: { not: id } },
          data: { enabled: false },
        });
      }
      return tx.llmModelConfig.update({
        where: { id },
        data: {
          provider: dto.provider,
          model: dto.model,
          apiKey: dto.apiKey,
          baseUrl: dto.baseUrl,
          chatPath: dto.chatPath,
          parameters: (dto.parameters ?? undefined) as Prisma.InputJsonValue | undefined,
          stream: dto.stream,
          maxTokens: dto.maxTokens,
          temperature: dto.temperature,
          enabled: dto.enabled,
        },
      });
    });
    await this.llmService.refreshConfigCache();
    return row;
  }

  async activate(id: number): Promise<LlmModelConfig> {
    return this.llmModelConfigActivate(id);
  }

  testConnection(id: number) {
    return this.llmService.testModelConfigConnection(id);
  }

  private async llmModelConfigActivate(id: number): Promise<LlmModelConfig> {
    const existing = await this.prisma.llmModelConfig.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`llm model config id=${id} not found`);
    }
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.llmModelConfig.updateMany({
        where: { kind: existing.kind, enabled: true, id: { not: id } },
        data: { enabled: false },
      });
      return tx.llmModelConfig.update({
        where: { id },
        data: { enabled: true },
      });
    });
    await this.llmService.refreshConfigCache();
    return row;
  }

  getIntentRecallConfig(): Promise<IntentRecallConfig> {
    return this.ensureIntentRecallConfig();
  }

  async updateIntentRecallConfig(
    dto: UpdateIntentRecallConfigDto,
  ): Promise<IntentRecallConfig> {
    await this.ensureIntentRecallConfig();
    const row = await this.prisma.intentRecallConfig.update({
      where: { singletonKey: 1 },
      data: {
        recallMode: dto.recallMode,
        vectorTopK: dto.vectorTopK,
        vectorMinScore: dto.vectorMinScore,
        bindToolsMax: dto.bindToolsMax,
        fallbackToKeyword: dto.fallbackToKeyword,
      },
    });
    await this.intentRecallConfig.refreshCache();
    return row;
  }

  private async ensureIntentRecallConfig(): Promise<IntentRecallConfig> {
    return this.prisma.intentRecallConfig.upsert({
      where: { singletonKey: 1 },
      create: {
        singletonKey: 1,
        recallMode: 'auto',
        vectorTopK: 10,
        vectorMinScore: 0.25,
        bindToolsMax: 25,
        fallbackToKeyword: true,
      },
      update: {},
    });
  }

  private defaultProvider(kind: LlmModelKind): string {
    if (kind === LlmModelKind.transformers_embedding) {
      return 'transformers.js';
    }
    if (kind === LlmModelKind.api_embedding) {
      return 'openai-compatible-embeddings';
    }
    return 'openai-compatible';
  }
}
