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
var AgentSkillCatalogStore_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentSkillCatalogStore = void 0;
const common_1 = require("@nestjs/common");
const redis_keys_1 = require("../memory/redis/redis-keys");
const redis_connection_service_1 = require("../memory/redis/redis-connection.service");
const runtime_cache_constants_1 = require("./runtime-cache.constants");
let AgentSkillCatalogStore = AgentSkillCatalogStore_1 = class AgentSkillCatalogStore {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(AgentSkillCatalogStore_1.name);
    }
    async get(appClientId, agentId, roleId) {
        const client = this.redis.getClient();
        if (!client) {
            return null;
        }
        const raw = await client.get((0, redis_keys_1.agentSkillCatalogKey)(appClientId, agentId, roleId));
        if (raw === null) {
            return null;
        }
        try {
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                return null;
            }
            const row = parsed;
            if (row.appClientId !== appClientId ||
                row.agentId !== agentId ||
                row.roleId !== roleId) {
                return null;
            }
            if (!Array.isArray(row.skills)) {
                return null;
            }
            return row;
        }
        catch (_a) {
            this.logger.warn(`corrupt skill catalog cache appClientId=${appClientId} agentId=${agentId} roleId=${roleId}`);
            return null;
        }
    }
    async trySet(snapshot) {
        const client = this.redis.getClient();
        if (!client) {
            return false;
        }
        await client.set((0, redis_keys_1.agentSkillCatalogKey)(snapshot.appClientId, snapshot.agentId, snapshot.roleId), JSON.stringify(snapshot), 'EX', (0, runtime_cache_constants_1.getRuntimeAgentCatalogTtlSec)());
        return true;
    }
    async deleteForAgent(appClientId, agentId) {
        const client = this.redis.getClient();
        if (!client) {
            return 0;
        }
        const pattern = (0, redis_keys_1.agentSkillCatalogScanPattern)(appClientId, agentId);
        let removed = 0;
        let cursor = '0';
        do {
            const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = nextCursor;
            if (keys.length > 0) {
                await client.del(...keys);
                removed += keys.length;
            }
        } while (cursor !== '0');
        if (removed > 0) {
            this.logger.debug(`deleted ${removed} skill catalog key(s) agentId=${agentId}`);
        }
        return removed;
    }
};
AgentSkillCatalogStore = AgentSkillCatalogStore_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_connection_service_1.RedisConnectionService])
], AgentSkillCatalogStore);
exports.AgentSkillCatalogStore = AgentSkillCatalogStore;
//# sourceMappingURL=agent-skill-catalog.store.js.map