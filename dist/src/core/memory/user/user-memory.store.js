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
var UserMemoryStore_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMemoryStore = void 0;
const common_1 = require("@nestjs/common");
const memory_id_util_1 = require("../shared/memory-id.util");
const memory_constants_1 = require("../shared/memory.constants");
const redis_connection_service_1 = require("../redis/redis-connection.service");
const redis_keys_1 = require("../redis/redis-keys");
let UserMemoryStore = UserMemoryStore_1 = class UserMemoryStore {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(UserMemoryStore_1.name);
    }
    async get(userId) {
        (0, memory_id_util_1.assertPositiveIntId)('userId', userId);
        const client = this.redis.getClient();
        if (!client) {
            return null;
        }
        const raw = await client.get((0, redis_keys_1.userMemoryKey)(userId));
        if (raw === null) {
            return null;
        }
        try {
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                return null;
            }
            return parsed;
        }
        catch (_a) {
            this.logger.warn(`corrupt user memory JSON for userId=${userId}`);
            return null;
        }
    }
    async set(userId, payload, ttlSeconds) {
        (0, memory_id_util_1.assertPositiveIntId)('userId', userId);
        const client = this.requireClient();
        const key = (0, redis_keys_1.userMemoryKey)(userId);
        const body = JSON.stringify(payload);
        const ttl = ttlSeconds !== undefined ? ttlSeconds : (0, memory_constants_1.getDefaultUserMemoryTtlSec)();
        if (ttl > 0) {
            await client.set(key, body, 'EX', ttl);
        }
        else {
            await client.set(key, body);
        }
    }
    async delete(userId) {
        (0, memory_id_util_1.assertPositiveIntId)('userId', userId);
        const client = this.requireClient();
        await client.del((0, redis_keys_1.userMemoryKey)(userId));
    }
    requireClient() {
        const client = this.redis.getClient();
        if (!client) {
            throw new common_1.ServiceUnavailableException('Redis is not available');
        }
        return client;
    }
};
UserMemoryStore = UserMemoryStore_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_connection_service_1.RedisConnectionService])
], UserMemoryStore);
exports.UserMemoryStore = UserMemoryStore;
//# sourceMappingURL=user-memory.store.js.map