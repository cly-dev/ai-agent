import { LlmModelKind, type IntentRecallConfig, type LlmModelConfig } from '../../../generated/prisma/client';
import { IntentRecallConfigService } from '../../core/intent/intent-recall-config.service';
import { LlmService } from '../../core/llm/llm.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { UpdateIntentRecallConfigDto } from './dto/update-intent-recall-config.dto';
import type { UpdateLlmModelConfigDto } from './dto/update-llm-model-config.dto';
import type { UpsertLlmModelConfigDto } from './dto/upsert-llm-model-config.dto';
export declare class LlmModelConfigService {
    private readonly prisma;
    private readonly llmService;
    private readonly intentRecallConfig;
    constructor(prisma: PrismaService, llmService: LlmService, intentRecallConfig: IntentRecallConfigService);
    findAll(): Promise<LlmModelConfig[]>;
    findByKind(kind: LlmModelKind): Promise<LlmModelConfig[]>;
    create(dto: UpsertLlmModelConfigDto): Promise<LlmModelConfig>;
    update(id: number, dto: UpdateLlmModelConfigDto): Promise<LlmModelConfig>;
    activate(id: number): Promise<LlmModelConfig>;
    getIntentRecallConfig(): Promise<IntentRecallConfig>;
    updateIntentRecallConfig(dto: UpdateIntentRecallConfigDto): Promise<IntentRecallConfig>;
    private ensureIntentRecallConfig;
    private defaultProvider;
}
