"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmModelConfigService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../generated/prisma/client");
const intent_recall_config_service_1 = require("../../core/intent/intent-recall-config.service");
const llm_service_1 = require("../../core/llm/llm.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let LlmModelConfigService = class LlmModelConfigService {
    constructor(prisma, llmService, intentRecallConfig) {
        this.prisma = prisma;
        this.llmService = llmService;
        this.intentRecallConfig = intentRecallConfig;
    }
    findAll() {
        return this.prisma.llmModelConfig.findMany({
            orderBy: [{ kind: 'asc' }, { updatedAt: 'desc' }],
        });
    }
    async findByKind(kind) {
        const rows = await this.prisma.llmModelConfig.findMany({
            where: { kind },
            orderBy: [{ enabled: 'desc' }, { updatedAt: 'desc' }, { id: 'desc' }],
        });
        if (rows.length === 0) {
            throw new common_1.NotFoundException(`llm model config kind=${kind} not found`);
        }
        return rows;
    }
    async create(dto) {
        const row = await this.prisma.$transaction(async (tx) => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const nextEnabled = (_a = dto.enabled) !== null && _a !== void 0 ? _a : true;
            if (nextEnabled) {
                await tx.llmModelConfig.updateMany({
                    where: { kind: dto.kind, enabled: true },
                    data: { enabled: false },
                });
            }
            return tx.llmModelConfig.create({
                data: {
                    kind: dto.kind,
                    provider: (_b = dto.provider) !== null && _b !== void 0 ? _b : this.defaultProvider(dto.kind),
                    model: dto.model,
                    apiKey: (_c = dto.apiKey) !== null && _c !== void 0 ? _c : null,
                    baseUrl: dto.baseUrl,
                    chatPath: (_d = dto.chatPath) !== null && _d !== void 0 ? _d : '/v1/chat/completions',
                    parameters: ((_e = dto.parameters) !== null && _e !== void 0 ? _e : undefined),
                    stream: (_f = dto.stream) !== null && _f !== void 0 ? _f : false,
                    maxTokens: (_g = dto.maxTokens) !== null && _g !== void 0 ? _g : null,
                    temperature: (_h = dto.temperature) !== null && _h !== void 0 ? _h : null,
                    enabled: nextEnabled,
                },
            });
        });
        await this.llmService.refreshConfigCache();
        return row;
    }
    async update(id, dto) {
        const existing = await this.prisma.llmModelConfig.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`llm model config id=${id} not found`);
        }
        const row = await this.prisma.$transaction(async (tx) => {
            var _a;
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
                    parameters: ((_a = dto.parameters) !== null && _a !== void 0 ? _a : undefined),
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
    async activate(id) {
        return this.llmModelConfigActivate(id);
    }
    testConnection(id) {
        return this.llmService.testModelConfigConnection(id);
    }
    async llmModelConfigActivate(id) {
        const existing = await this.prisma.llmModelConfig.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`llm model config id=${id} not found`);
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
    getIntentRecallConfig() {
        return this.ensureIntentRecallConfig();
    }
    async updateIntentRecallConfig(dto) {
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
    async ensureIntentRecallConfig() {
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
    defaultProvider(kind) {
        if (kind === client_1.LlmModelKind.transformers_embedding) {
            return 'transformers.js';
        }
        if (kind === client_1.LlmModelKind.api_embedding) {
            return 'openai-compatible-embeddings';
        }
        return 'openai-compatible';
    }
};
LlmModelConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        llm_service_1.LlmService,
        intent_recall_config_service_1.IntentRecallConfigService])
], LlmModelConfigService);
exports.LlmModelConfigService = LlmModelConfigService;
//# sourceMappingURL=llm-model-config.service.js.map