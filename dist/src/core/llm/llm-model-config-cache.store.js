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
var LlmModelConfigCacheStore_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmModelConfigCacheStore = void 0;
const common_1 = require("@nestjs/common");
const redis_connection_service_1 = require("../memory/redis/redis-connection.service");
const redis_keys_1 = require("../memory/redis/redis-keys");
const llm_model_config_cache_constants_1 = require("./llm-model-config-cache.constants");
let LlmModelConfigCacheStore = LlmModelConfigCacheStore_1 = class LlmModelConfigCacheStore {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(LlmModelConfigCacheStore_1.name);
    }
    async getActive(kind) {
        var _a, _b, _c, _d;
        const client = this.redis.getClient();
        if (!client) {
            return null;
        }
        const raw = await client.get((0, redis_keys_1.llmModelConfigActiveKey)(kind));
        if (raw === null) {
            return null;
        }
        try {
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                return null;
            }
            const row = parsed;
            if (typeof row.id !== 'number' ||
                typeof row.kind !== 'string' ||
                typeof row.provider !== 'string' ||
                typeof row.model !== 'string' ||
                typeof row.baseUrl !== 'string' ||
                typeof row.chatPath !== 'string' ||
                typeof row.stream !== 'boolean' ||
                typeof row.enabled !== 'boolean') {
                return null;
            }
            return {
                id: row.id,
                kind: row.kind,
                singletonKey: null,
                provider: row.provider,
                model: row.model,
                apiKey: (_a = row.apiKey) !== null && _a !== void 0 ? _a : null,
                baseUrl: row.baseUrl,
                chatPath: row.chatPath,
                parameters: ((_b = row.parameters) !== null && _b !== void 0 ? _b : null),
                stream: row.stream,
                maxTokens: (_c = row.maxTokens) !== null && _c !== void 0 ? _c : null,
                temperature: (_d = row.temperature) !== null && _d !== void 0 ? _d : null,
                enabled: row.enabled,
                createdAt: new Date(0),
                updatedAt: new Date(0),
            };
        }
        catch (_e) {
            this.logger.warn(`corrupt llm model config cache kind=${kind}`);
            return null;
        }
    }
    async trySetActive(config) {
        const client = this.redis.getClient();
        if (!client) {
            return false;
        }
        const payload = {
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
        await client.set((0, redis_keys_1.llmModelConfigActiveKey)(config.kind), JSON.stringify(payload), 'EX', (0, llm_model_config_cache_constants_1.getLlmModelConfigCacheTtlSec)());
        return true;
    }
    async deleteActive(kind) {
        const client = this.redis.getClient();
        if (!client) {
            return;
        }
        await client.del((0, redis_keys_1.llmModelConfigActiveKey)(kind));
    }
};
LlmModelConfigCacheStore = LlmModelConfigCacheStore_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_connection_service_1.RedisConnectionService])
], LlmModelConfigCacheStore);
exports.LlmModelConfigCacheStore = LlmModelConfigCacheStore;
//# sourceMappingURL=llm-model-config-cache.store.js.map