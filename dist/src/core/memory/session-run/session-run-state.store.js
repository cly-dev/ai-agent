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
var SessionRunStateStore_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionRunStateStore = void 0;
const node_crypto_1 = require("node:crypto");
const node_os_1 = require("node:os");
const common_1 = require("@nestjs/common");
const redis_keys_1 = require("../redis/redis-keys");
const redis_connection_service_1 = require("../redis/redis-connection.service");
const ACTIVE_TTL_SEC = 2 * 60 * 60;
const DRAIN_LOCK_TTL_SEC = 5 * 60;
let SessionRunStateStore = SessionRunStateStore_1 = class SessionRunStateStore {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(SessionRunStateStore_1.name);
        this.instanceId = `${(0, node_os_1.hostname)()}:${process.pid}:${(0, node_crypto_1.randomUUID)().slice(0, 8)}`;
        this.generationLocal = new Map();
        this.bindingsLocal = new Map();
        this.productionRedisWarned = false;
        this.subscriber = null;
        this.remoteSupersedeHandler = null;
    }
    onModuleInit() {
        const isProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod';
        if (isProd && !this.redis.getClient()) {
            this.logger.error('SESSION RUN: Redis is not configured in production — generation will not sync across instances. Set REDIS_URL or REDIS_HOST.');
            this.productionRedisWarned = true;
        }
        const client = this.redis.getClient();
        if (!client) {
            return;
        }
        this.subscriber = client.duplicate();
        void this.subscriber
            .subscribe(redis_keys_1.SESSION_RUN_SUPERSEDE_CHANNEL)
            .then(() => {
            var _a;
            (_a = this.subscriber) === null || _a === void 0 ? void 0 : _a.on('message', (_channel, raw) => {
                this.handleSupersedeMessage(raw);
            });
        })
            .catch((error) => {
            this.logger.warn(`session run supersede subscribe failed: ${error instanceof Error ? error.message : String(error)}`);
        });
    }
    onModuleDestroy() {
        if (this.subscriber) {
            void this.subscriber.quit();
            this.subscriber = null;
        }
    }
    getInstanceId() {
        return this.instanceId;
    }
    setRemoteSupersedeHandler(handler) {
        this.remoteSupersedeHandler = handler;
    }
    isRedisBacked() {
        return this.redis.getClient() != null;
    }
    bindingField(runId) {
        return String(runId);
    }
    bindingMapKey(sessionId, runId) {
        return `${sessionId}:${runId}`;
    }
    handleSupersedeMessage(raw) {
        if (!this.remoteSupersedeHandler) {
            return;
        }
        try {
            const parsed = JSON.parse(raw);
            if (typeof parsed.sessionId !== 'string' ||
                typeof parsed.generation !== 'number' ||
                (parsed.reason !== 'user_message' && parsed.reason !== 'cancel_api')) {
                return;
            }
            this.remoteSupersedeHandler(parsed);
        }
        catch (_a) {
        }
    }
    async hydrateGeneration(sessionId) {
        var _a, _b, _c;
        const client = this.redis.getClient();
        if (!client) {
            return (_a = this.generationLocal.get(sessionId)) !== null && _a !== void 0 ? _a : 0;
        }
        try {
            const raw = await client.get((0, redis_keys_1.sessionRunGenerationKey)(sessionId));
            const remote = raw != null ? Number.parseInt(raw, 10) : 0;
            const local = (_b = this.generationLocal.get(sessionId)) !== null && _b !== void 0 ? _b : 0;
            const merged = Number.isFinite(remote) ? Math.max(local, remote) : local;
            this.generationLocal.set(sessionId, merged);
            return merged;
        }
        catch (error) {
            this.logger.warn(`session run generation hydrate failed sessionId=${sessionId}: ${error instanceof Error ? error.message : String(error)}`);
            return (_c = this.generationLocal.get(sessionId)) !== null && _c !== void 0 ? _c : 0;
        }
    }
    getGenerationLocal(sessionId) {
        var _a;
        return (_a = this.generationLocal.get(sessionId)) !== null && _a !== void 0 ? _a : 0;
    }
    setGenerationLocal(sessionId, generation) {
        this.generationLocal.set(sessionId, generation);
    }
    async incrementGeneration(sessionId) {
        var _a;
        const client = this.redis.getClient();
        if (client) {
            try {
                const next = await client.incr((0, redis_keys_1.sessionRunGenerationKey)(sessionId));
                this.generationLocal.set(sessionId, next);
                return next;
            }
            catch (error) {
                this.logger.warn(`session run generation incr failed sessionId=${sessionId}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        const next = ((_a = this.generationLocal.get(sessionId)) !== null && _a !== void 0 ? _a : 0) + 1;
        this.generationLocal.set(sessionId, next);
        if (!this.productionRedisWarned &&
            (process.env.NODE_ENV === 'production' ||
                process.env.NODE_ENV === 'prod')) {
            this.logger.warn(`session run generation incremented in-memory only sessionId=${sessionId}`);
        }
        return next;
    }
    async publishSupersedeEvent(event) {
        this.setGenerationLocal(event.sessionId, event.generation);
        const client = this.redis.getClient();
        if (!client) {
            return;
        }
        try {
            await client.publish(redis_keys_1.SESSION_RUN_SUPERSEDE_CHANNEL, JSON.stringify(event));
        }
        catch (error) {
            this.logger.warn(`session run supersede publish failed sessionId=${event.sessionId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async clearLegacySessionQueue(sessionId) {
        const client = this.redis.getClient();
        if (!client) {
            return;
        }
        try {
            await client.del((0, redis_keys_1.sessionRunQueueKey)(sessionId));
        }
        catch (_a) {
        }
    }
    async acquireDrainLock(sessionId) {
        const client = this.redis.getClient();
        if (!client) {
            return true;
        }
        try {
            const result = await client.set((0, redis_keys_1.sessionRunDrainLockKey)(sessionId), this.instanceId, 'EX', DRAIN_LOCK_TTL_SEC, 'NX');
            return result === 'OK';
        }
        catch (error) {
            this.logger.warn(`session run drain lock acquire failed sessionId=${sessionId}: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
    async renewDrainLock(sessionId) {
        const client = this.redis.getClient();
        if (!client) {
            return true;
        }
        const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("expire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;
        try {
            const result = await client.eval(script, 1, (0, redis_keys_1.sessionRunDrainLockKey)(sessionId), this.instanceId, String(DRAIN_LOCK_TTL_SEC));
            return result === 1;
        }
        catch (_a) {
            return false;
        }
    }
    async releaseDrainLock(sessionId) {
        const client = this.redis.getClient();
        if (!client) {
            return;
        }
        const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
        try {
            await client.eval(script, 1, (0, redis_keys_1.sessionRunDrainLockKey)(sessionId), this.instanceId);
        }
        catch (_a) {
        }
    }
    async bindRunGeneration(sessionId, runId, generation) {
        this.bindingsLocal.set(this.bindingMapKey(sessionId, runId), generation);
        const client = this.redis.getClient();
        if (!client) {
            return;
        }
        try {
            await client.hset((0, redis_keys_1.sessionRunBindingsKey)(sessionId), this.bindingField(runId), String(generation));
        }
        catch (error) {
            this.logger.warn(`session run bind failed sessionId=${sessionId} runId=${runId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async unbindRunGeneration(sessionId, runId) {
        this.bindingsLocal.delete(this.bindingMapKey(sessionId, runId));
        const client = this.redis.getClient();
        if (!client) {
            return;
        }
        try {
            await client.hdel((0, redis_keys_1.sessionRunBindingsKey)(sessionId), this.bindingField(runId));
        }
        catch (error) {
            this.logger.warn(`session run unbind failed sessionId=${sessionId} runId=${runId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    getBoundRunGenerationLocal(sessionId, runId) {
        var _a;
        return ((_a = this.bindingsLocal.get(this.bindingMapKey(sessionId, runId))) !== null && _a !== void 0 ? _a : null);
    }
    async setActiveSnapshot(sessionId, snapshot) {
        const client = this.redis.getClient();
        if (!client) {
            return;
        }
        try {
            await client.set((0, redis_keys_1.sessionRunActiveKey)(sessionId), JSON.stringify(snapshot), 'EX', ACTIVE_TTL_SEC);
        }
        catch (error) {
            this.logger.warn(`session run active set failed sessionId=${sessionId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async clearActiveSnapshot(sessionId) {
        const client = this.redis.getClient();
        if (!client) {
            return;
        }
        try {
            await client.del((0, redis_keys_1.sessionRunActiveKey)(sessionId));
        }
        catch (_a) {
        }
    }
    async getActiveSnapshot(sessionId) {
        const client = this.redis.getClient();
        if (!client) {
            return null;
        }
        try {
            const raw = await client.get((0, redis_keys_1.sessionRunActiveKey)(sessionId));
            if (!raw) {
                return null;
            }
            const parsed = JSON.parse(raw);
            if (typeof parsed.runId !== 'number' ||
                typeof parsed.generation !== 'number') {
                return null;
            }
            return parsed;
        }
        catch (_a) {
            return null;
        }
    }
    async evictSession(sessionId) {
        this.generationLocal.delete(sessionId);
        const prefix = `${sessionId}:`;
        for (const key of this.bindingsLocal.keys()) {
            if (key.startsWith(prefix)) {
                this.bindingsLocal.delete(key);
            }
        }
        const client = this.redis.getClient();
        if (!client) {
            return;
        }
        try {
            await this.releaseDrainLock(sessionId);
            await client.del((0, redis_keys_1.sessionRunGenerationKey)(sessionId), (0, redis_keys_1.sessionRunBindingsKey)(sessionId), (0, redis_keys_1.sessionRunActiveKey)(sessionId), (0, redis_keys_1.sessionRunQueueKey)(sessionId), (0, redis_keys_1.sessionRunDrainLockKey)(sessionId));
        }
        catch (error) {
            this.logger.warn(`session run evict redis failed sessionId=${sessionId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
};
SessionRunStateStore = SessionRunStateStore_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_connection_service_1.RedisConnectionService])
], SessionRunStateStore);
exports.SessionRunStateStore = SessionRunStateStore;
//# sourceMappingURL=session-run-state.store.js.map