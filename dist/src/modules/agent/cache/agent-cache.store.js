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
var AgentCacheStore_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentCacheStore = void 0;
const common_1 = require("@nestjs/common");
const redis_keys_1 = require("../../../core/memory/redis/redis-keys");
const redis_connection_service_1 = require("../../../core/memory/redis/redis-connection.service");
const agent_cache_constants_1 = require("./agent-cache.constants");
let AgentCacheStore = AgentCacheStore_1 = class AgentCacheStore {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(AgentCacheStore_1.name);
    }
    async get(appClientId, agentId) {
        var _a;
        const client = this.redis.getClient();
        if (!client) {
            return null;
        }
        const raw = await client.get((0, redis_keys_1.agentRuntimeKey)(appClientId, agentId));
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
                typeof row.appClientId !== 'number' ||
                typeof row.name !== 'string' ||
                typeof row.systemPrompt !== 'string' ||
                typeof row.maxSteps !== 'number' ||
                typeof row.enableToolCall !== 'boolean') {
                return null;
            }
            return {
                id: row.id,
                appClientId: row.appClientId,
                name: row.name,
                systemPrompt: row.systemPrompt,
                maxSteps: row.maxSteps,
                enableToolCall: row.enableToolCall,
                config: (_a = row.config) !== null && _a !== void 0 ? _a : null,
            };
        }
        catch (_b) {
            this.logger.warn(`corrupt agent runtime cache appClientId=${appClientId} agentId=${agentId}`);
            return null;
        }
    }
    async trySet(appClientId, agentId, snapshot) {
        const client = this.redis.getClient();
        if (!client) {
            return false;
        }
        const ttl = (0, agent_cache_constants_1.getAgentRuntimeCacheTtlSec)();
        await client.set((0, redis_keys_1.agentRuntimeKey)(appClientId, agentId), JSON.stringify(snapshot), 'EX', ttl);
        return true;
    }
    async delete(appClientId, agentId) {
        const client = this.redis.getClient();
        if (!client) {
            return;
        }
        await client.del((0, redis_keys_1.agentRuntimeKey)(appClientId, agentId));
    }
};
AgentCacheStore = AgentCacheStore_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_connection_service_1.RedisConnectionService])
], AgentCacheStore);
exports.AgentCacheStore = AgentCacheStore;
//# sourceMappingURL=agent-cache.store.js.map