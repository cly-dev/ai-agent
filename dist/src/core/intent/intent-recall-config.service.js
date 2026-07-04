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
var IntentRecallConfigService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentRecallConfigService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const intent_recall_config_cache_store_1 = require("./intent-recall-config-cache.store");
let IntentRecallConfigService = IntentRecallConfigService_1 = class IntentRecallConfigService {
    constructor(prisma, configCache) {
        this.prisma = prisma;
        this.configCache = configCache;
        this.logger = new common_1.Logger(IntentRecallConfigService_1.name);
        this.cached = null;
    }
    async onModuleInit() {
        try {
            await this.refreshCache();
        }
        catch (error) {
            this.logger.warn(`intent recall config preload skipped: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async get() {
        if (this.cached) {
            return this.cached;
        }
        const fromRedis = await this.configCache.get();
        if (fromRedis) {
            this.cached = fromRedis;
            return fromRedis;
        }
        return this.refreshCache();
    }
    async refreshCache() {
        const row = await this.prisma.intentRecallConfig.findFirst({
            where: { singletonKey: 1 },
        });
        const resolved = row ? this.mapRow(row) : this.resolveFromEnv();
        this.cached = resolved;
        await this.configCache.trySet(resolved);
        return resolved;
    }
    async resolveRecallMode(embeddingConfigured) {
        const cfg = await this.get();
        if (cfg.recallMode === 'keyword') {
            return { useVector: false, reason: 'recallMode=keyword (db)' };
        }
        if (cfg.recallMode === 'vector') {
            return {
                useVector: true,
                reason: embeddingConfigured
                    ? 'recallMode=vector (db)'
                    : 'recallMode=vector but embedding not configured',
            };
        }
        return {
            useVector: embeddingConfigured,
            reason: embeddingConfigured
                ? 'recallMode=auto with embedding configured'
                : 'recallMode=auto without embedding',
        };
    }
    shouldFallbackToKeywordOnError() {
        return this.get().then((cfg) => cfg.fallbackToKeyword);
    }
    mapRow(row) {
        return {
            recallMode: this.parseRecallMode(row.recallMode),
            vectorTopK: row.vectorTopK > 0 ? row.vectorTopK : 10,
            vectorMinScore: Number.isFinite(row.vectorMinScore) && row.vectorMinScore >= 0
                ? row.vectorMinScore
                : 0.25,
            bindToolsMax: row.bindToolsMax > 0 ? row.bindToolsMax : 25,
            fallbackToKeyword: row.fallbackToKeyword,
            source: 'database',
        };
    }
    resolveFromEnv() {
        return {
            recallMode: this.parseRecallMode(process.env.AGENT_INTENT_RECALL_MODE),
            vectorTopK: this.readPositiveIntEnv('AGENT_INTENT_VECTOR_TOP_K', 10),
            vectorMinScore: this.readFloatEnv('AGENT_INTENT_VECTOR_MIN_SCORE', 0.25),
            bindToolsMax: this.readPositiveIntEnv('AGENT_BIND_TOOLS_MAX', 25),
            fallbackToKeyword: true,
            source: 'env',
        };
    }
    parseRecallMode(raw) {
        const mode = raw === null || raw === void 0 ? void 0 : raw.trim().toLowerCase();
        if (mode === 'vector' || mode === 'keyword') {
            return mode;
        }
        return 'auto';
    }
    readPositiveIntEnv(name, fallback) {
        var _a;
        const raw = (_a = process.env[name]) === null || _a === void 0 ? void 0 : _a.trim();
        if (!raw) {
            return fallback;
        }
        const value = Number.parseInt(raw, 10);
        return Number.isFinite(value) && value > 0 ? value : fallback;
    }
    readFloatEnv(name, fallback) {
        var _a;
        const raw = (_a = process.env[name]) === null || _a === void 0 ? void 0 : _a.trim();
        if (!raw) {
            return fallback;
        }
        const value = Number.parseFloat(raw);
        return Number.isFinite(value) && value >= 0 ? value : fallback;
    }
};
IntentRecallConfigService = IntentRecallConfigService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        intent_recall_config_cache_store_1.IntentRecallConfigCacheStore])
], IntentRecallConfigService);
exports.IntentRecallConfigService = IntentRecallConfigService;
//# sourceMappingURL=intent-recall-config.service.js.map