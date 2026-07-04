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
var IntentRecallConfigCacheStore_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentRecallConfigCacheStore = void 0;
const common_1 = require("@nestjs/common");
const redis_connection_service_1 = require("../memory/redis/redis-connection.service");
const redis_keys_1 = require("../memory/redis/redis-keys");
const intent_recall_config_cache_constants_1 = require("./intent-recall-config-cache.constants");
let IntentRecallConfigCacheStore = IntentRecallConfigCacheStore_1 = class IntentRecallConfigCacheStore {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(IntentRecallConfigCacheStore_1.name);
    }
    async get() {
        const client = this.redis.getClient();
        if (!client) {
            return null;
        }
        const raw = await client.get((0, redis_keys_1.intentRecallConfigKey)());
        if (raw === null) {
            return null;
        }
        try {
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                return null;
            }
            const row = parsed;
            if (typeof row.recallMode !== 'string' ||
                typeof row.vectorTopK !== 'number' ||
                typeof row.vectorMinScore !== 'number' ||
                typeof row.bindToolsMax !== 'number' ||
                typeof row.fallbackToKeyword !== 'boolean') {
                return null;
            }
            const mode = row.recallMode;
            if (mode !== 'auto' && mode !== 'vector' && mode !== 'keyword') {
                return null;
            }
            return {
                recallMode: mode,
                vectorTopK: row.vectorTopK,
                vectorMinScore: row.vectorMinScore,
                bindToolsMax: row.bindToolsMax,
                fallbackToKeyword: row.fallbackToKeyword,
                source: 'database',
            };
        }
        catch (_a) {
            this.logger.warn('corrupt intent recall config cache');
            return null;
        }
    }
    async trySet(config) {
        const client = this.redis.getClient();
        if (!client) {
            return false;
        }
        await client.set((0, redis_keys_1.intentRecallConfigKey)(), JSON.stringify(config), 'EX', (0, intent_recall_config_cache_constants_1.getIntentRecallConfigCacheTtlSec)());
        return true;
    }
    async delete() {
        const client = this.redis.getClient();
        if (!client) {
            return;
        }
        await client.del((0, redis_keys_1.intentRecallConfigKey)());
    }
};
IntentRecallConfigCacheStore = IntentRecallConfigCacheStore_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_connection_service_1.RedisConnectionService])
], IntentRecallConfigCacheStore);
exports.IntentRecallConfigCacheStore = IntentRecallConfigCacheStore;
//# sourceMappingURL=intent-recall-config-cache.store.js.map