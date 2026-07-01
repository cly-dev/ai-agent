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
var PendingWriteConfirmationStore_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PendingWriteConfirmationStore = void 0;
const common_1 = require("@nestjs/common");
const redis_keys_1 = require("../../core/memory/redis/redis-keys");
const redis_connection_service_1 = require("../../core/memory/redis/redis-connection.service");
const TTL_SEC = 30 * 60;
let PendingWriteConfirmationStore = PendingWriteConfirmationStore_1 = class PendingWriteConfirmationStore {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(PendingWriteConfirmationStore_1.name);
        this.memory = new Map();
    }
    async set(snapshot) {
        const key = (0, redis_keys_1.pendingWriteConfirmationKey)(snapshot.sessionId);
        const payload = JSON.stringify(snapshot);
        const client = this.redis.getClient();
        if (client) {
            try {
                await client.set(key, payload, 'EX', TTL_SEC);
                return;
            }
            catch (error) {
                this.logger.warn(`pending write confirmation redis set failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        this.memory.set(key, snapshot);
    }
    async get(sessionId, userId) {
        const key = (0, redis_keys_1.pendingWriteConfirmationKey)(sessionId);
        const client = this.redis.getClient();
        if (client) {
            try {
                const raw = await client.get(key);
                if (raw) {
                    return this.parseAndValidate(raw, sessionId, userId);
                }
            }
            catch (error) {
                this.logger.warn(`pending write confirmation redis get failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        const cached = this.memory.get(key);
        if (!cached) {
            return null;
        }
        return cached.userId === userId ? cached : null;
    }
    async consume(sessionId, userId) {
        const snapshot = await this.get(sessionId, userId);
        if (!snapshot) {
            return null;
        }
        await this.clear(sessionId);
        return snapshot;
    }
    async clear(sessionId) {
        const key = (0, redis_keys_1.pendingWriteConfirmationKey)(sessionId);
        const client = this.redis.getClient();
        if (client) {
            try {
                await client.del(key);
            }
            catch (_a) {
            }
        }
        this.memory.delete(key);
    }
    parseAndValidate(raw, sessionId, userId) {
        var _a;
        try {
            const parsed = JSON.parse(raw);
            if (parsed.sessionId !== sessionId ||
                parsed.userId !== userId ||
                !Array.isArray(parsed.toolCalls) ||
                !parsed.resumeContext ||
                !Array.isArray(parsed.resumeContext.steps) ||
                !Array.isArray(parsed.resumeContext.toolObservations) ||
                !Array.isArray(parsed.resumeContext.scopedToolIds)) {
                return null;
            }
            return Object.assign(Object.assign({}, parsed), { resumeContext: Object.assign(Object.assign({}, parsed.resumeContext), { hasExpandedOnce: parsed.resumeContext.hasExpandedOnce === true, pageContext: (_a = parsed.resumeContext.pageContext) !== null && _a !== void 0 ? _a : null }) });
        }
        catch (_b) {
            return null;
        }
    }
};
PendingWriteConfirmationStore = PendingWriteConfirmationStore_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_connection_service_1.RedisConnectionService])
], PendingWriteConfirmationStore);
exports.PendingWriteConfirmationStore = PendingWriteConfirmationStore;
//# sourceMappingURL=pending-write-confirmation.store.js.map