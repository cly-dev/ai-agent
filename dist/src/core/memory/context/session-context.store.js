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
var SessionContextStore_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionContextStore = void 0;
const common_1 = require("@nestjs/common");
const memory_id_util_1 = require("../shared/memory-id.util");
const memory_constants_1 = require("../shared/memory.constants");
const redis_connection_service_1 = require("../redis/redis-connection.service");
const redis_keys_1 = require("../redis/redis-keys");
const session_context_patch_util_1 = require("./session-context-patch.util");
let SessionContextStore = SessionContextStore_1 = class SessionContextStore {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(SessionContextStore_1.name);
    }
    async get(sessionId) {
        (0, memory_id_util_1.assertSessionContextId)('sessionId', sessionId);
        const client = this.redis.getClient();
        if (!client) {
            return null;
        }
        const raw = await client.get((0, redis_keys_1.sessionContextKey)(sessionId));
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
            this.logger.warn(`corrupt session context JSON for sessionId=${sessionId}`);
            return null;
        }
    }
    async set(sessionId, payload, ttlSeconds) {
        (0, memory_id_util_1.assertSessionContextId)('sessionId', sessionId);
        const client = this.requireClient();
        const key = (0, redis_keys_1.sessionContextKey)(sessionId);
        const ttl = ttlSeconds !== null && ttlSeconds !== void 0 ? ttlSeconds : (0, memory_constants_1.getDefaultSessionContextTtlSec)();
        const body = JSON.stringify(payload);
        await client.set(key, body, 'EX', ttl);
    }
    async trySet(sessionId, payload, ttlSeconds) {
        (0, memory_id_util_1.assertSessionContextId)('sessionId', sessionId);
        const client = this.redis.getClient();
        if (!client) {
            return false;
        }
        const ttl = ttlSeconds !== null && ttlSeconds !== void 0 ? ttlSeconds : (0, memory_constants_1.getDefaultSessionContextTtlSec)();
        await client.set((0, redis_keys_1.sessionContextKey)(sessionId), JSON.stringify(payload), 'EX', ttl);
        return true;
    }
    async patch(sessionId, partial, ttlSeconds) {
        (0, memory_id_util_1.assertSessionContextId)('sessionId', sessionId);
        const client = this.requireClient();
        const key = (0, redis_keys_1.sessionContextKey)(sessionId);
        const ttl = ttlSeconds !== null && ttlSeconds !== void 0 ? ttlSeconds : (0, memory_constants_1.getDefaultSessionContextTtlSec)();
        try {
            return await (0, session_context_patch_util_1.atomicShallowPatchSessionContext)({
                client,
                key,
                partial,
                ttlSeconds: ttl,
                onCorruptJson: () => {
                    this.logger.warn(`corrupt session context JSON for sessionId=${sessionId}`);
                },
            });
        }
        catch (error) {
            throw new common_1.ServiceUnavailableException(error instanceof Error ? error.message : 'session context patch failed');
        }
    }
    async patchMerge(sessionId, merge, ttlSeconds) {
        (0, memory_id_util_1.assertSessionContextId)('sessionId', sessionId);
        const client = this.requireClient();
        const key = (0, redis_keys_1.sessionContextKey)(sessionId);
        const ttl = ttlSeconds !== null && ttlSeconds !== void 0 ? ttlSeconds : (0, memory_constants_1.getDefaultSessionContextTtlSec)();
        try {
            return await (0, session_context_patch_util_1.atomicMergePatchSessionContext)({
                client,
                key,
                ttlSeconds: ttl,
                merge,
                onCorruptJson: () => {
                    this.logger.warn(`corrupt session context JSON for sessionId=${sessionId}`);
                },
            });
        }
        catch (error) {
            throw new common_1.ServiceUnavailableException(error instanceof Error ? error.message : 'session context patch failed');
        }
    }
    async tryPatch(sessionId, partial, ttlSeconds) {
        (0, memory_id_util_1.assertSessionContextId)('sessionId', sessionId);
        const client = this.redis.getClient();
        if (!client) {
            return null;
        }
        const key = (0, redis_keys_1.sessionContextKey)(sessionId);
        const ttl = ttlSeconds !== null && ttlSeconds !== void 0 ? ttlSeconds : (0, memory_constants_1.getDefaultSessionContextTtlSec)();
        try {
            return await (0, session_context_patch_util_1.atomicShallowPatchSessionContext)({
                client,
                key,
                partial,
                ttlSeconds: ttl,
                onCorruptJson: () => {
                    this.logger.warn(`corrupt session context JSON for sessionId=${sessionId}`);
                },
            });
        }
        catch (error) {
            this.logger.warn(`session context tryPatch skipped sessionId=${sessionId}: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    async tryPatchMerge(sessionId, merge, ttlSeconds) {
        (0, memory_id_util_1.assertSessionContextId)('sessionId', sessionId);
        const client = this.redis.getClient();
        if (!client) {
            return null;
        }
        const key = (0, redis_keys_1.sessionContextKey)(sessionId);
        const ttl = ttlSeconds !== null && ttlSeconds !== void 0 ? ttlSeconds : (0, memory_constants_1.getDefaultSessionContextTtlSec)();
        try {
            return await (0, session_context_patch_util_1.atomicMergePatchSessionContext)({
                client,
                key,
                ttlSeconds: ttl,
                merge,
                onCorruptJson: () => {
                    this.logger.warn(`corrupt session context JSON for sessionId=${sessionId}`);
                },
            });
        }
        catch (error) {
            this.logger.warn(`session context tryPatchMerge skipped sessionId=${sessionId}: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    async touch(sessionId, ttlSeconds) {
        (0, memory_id_util_1.assertSessionContextId)('sessionId', sessionId);
        const client = this.requireClient();
        const key = (0, redis_keys_1.sessionContextKey)(sessionId);
        const ttl = ttlSeconds !== null && ttlSeconds !== void 0 ? ttlSeconds : (0, memory_constants_1.getDefaultSessionContextTtlSec)();
        const n = await client.expire(key, ttl);
        if (n !== 1) {
            throw new common_1.ServiceUnavailableException('session context key missing; cannot refresh TTL');
        }
    }
    async delete(sessionId) {
        (0, memory_id_util_1.assertSessionContextId)('sessionId', sessionId);
        const client = this.requireClient();
        await client.del((0, redis_keys_1.sessionContextKey)(sessionId));
    }
    requireClient() {
        const client = this.redis.getClient();
        if (!client) {
            throw new common_1.ServiceUnavailableException('Redis is not available');
        }
        return client;
    }
};
SessionContextStore = SessionContextStore_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_connection_service_1.RedisConnectionService])
], SessionContextStore);
exports.SessionContextStore = SessionContextStore;
//# sourceMappingURL=session-context.store.js.map