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
var AgentToolCatalogStore_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentToolCatalogStore = void 0;
const common_1 = require("@nestjs/common");
const redis_keys_1 = require("../memory/redis/redis-keys");
const redis_connection_service_1 = require("../memory/redis/redis-connection.service");
const runtime_cache_constants_1 = require("./runtime-cache.constants");
let AgentToolCatalogStore = AgentToolCatalogStore_1 = class AgentToolCatalogStore {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(AgentToolCatalogStore_1.name);
    }
    async get(appClientId, agentId) {
        const client = this.redis.getClient();
        if (!client) {
            return null;
        }
        const raw = await client.get((0, redis_keys_1.agentToolCatalogKey)(appClientId, agentId));
        if (raw === null) {
            return null;
        }
        try {
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                return null;
            }
            const row = parsed;
            if (row.appClientId !== appClientId || row.agentId !== agentId) {
                return null;
            }
            if (!Array.isArray(row.tools) || !Array.isArray(row.agentBoundToolIds)) {
                return null;
            }
            return row;
        }
        catch (_a) {
            this.logger.warn(`corrupt tool catalog cache appClientId=${appClientId} agentId=${agentId}`);
            return null;
        }
    }
    async trySet(snapshot) {
        const client = this.redis.getClient();
        if (!client) {
            return false;
        }
        await client.set((0, redis_keys_1.agentToolCatalogKey)(snapshot.appClientId, snapshot.agentId), JSON.stringify(snapshot), 'EX', (0, runtime_cache_constants_1.getRuntimeAgentCatalogTtlSec)());
        return true;
    }
    async delete(appClientId, agentId) {
        const client = this.redis.getClient();
        if (!client) {
            return;
        }
        await client.del((0, redis_keys_1.agentToolCatalogKey)(appClientId, agentId));
    }
};
AgentToolCatalogStore = AgentToolCatalogStore_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_connection_service_1.RedisConnectionService])
], AgentToolCatalogStore);
exports.AgentToolCatalogStore = AgentToolCatalogStore;
//# sourceMappingURL=agent-tool-catalog.store.js.map