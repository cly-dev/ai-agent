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
var SessionGoaStore_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionGoaStore = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const memory_constants_1 = require("../shared/memory.constants");
const redis_connection_service_1 = require("../redis/redis-connection.service");
const redis_keys_1 = require("../redis/redis-keys");
const session_context_store_1 = require("../context/session-context.store");
const session_goa_replay_service_1 = require("./session-goa-replay.service");
const session_context_types_1 = require("../context/session-context.types");
const session_goa_legacy_cleanup_util_1 = require("./session-goa-legacy-cleanup.util");
const session_goa_migrate_util_1 = require("./session-goa-migrate.util");
const session_goa_types_1 = require("./session-goa.types");
let SessionGoaStore = SessionGoaStore_1 = class SessionGoaStore {
    constructor(prisma, redis, sessionContextStore, replayService) {
        this.prisma = prisma;
        this.redis = redis;
        this.sessionContextStore = sessionContextStore;
        this.replayService = replayService;
        this.logger = new common_1.Logger(SessionGoaStore_1.name);
    }
    async get(sessionId) {
        const fromDb = await this.readFromDb(sessionId);
        if (fromDb) {
            await this.syncCacheFromDb(sessionId, fromDb);
            return fromDb;
        }
        await this.invalidateCache(sessionId);
        return (0, session_goa_types_1.createEmptySessionGoaPayload)(sessionId);
    }
    async warm(sessionId) {
        const fromDb = await this.readFromDb(sessionId);
        if (fromDb) {
            await this.syncCacheFromDb(sessionId, fromDb);
            return fromDb;
        }
        const migrated = await this.migrateFromLegacyRedis(sessionId);
        if (migrated) {
            await this.save(sessionId, migrated);
            return migrated;
        }
        const replayed = await this.replayService.replay(sessionId);
        if (replayed) {
            await this.save(sessionId, replayed);
            return replayed;
        }
        const empty = (0, session_goa_types_1.createEmptySessionGoaPayload)(sessionId);
        await this.syncCacheFromDb(sessionId, empty);
        return empty;
    }
    async save(sessionId, payload) {
        const body = Object.assign(Object.assign({}, payload), { sessionId, updatedAt: new Date().toISOString() });
        await this.prisma.sessionGoaMemory.upsert({
            where: { sessionId },
            create: {
                sessionId,
                payload: body,
            },
            update: {
                payload: body,
            },
        });
        await this.writeCache(sessionId, body);
    }
    async saveIfUnchanged(sessionId, payload, expectedUpdatedAt) {
        const row = await this.prisma.sessionGoaMemory.findUnique({
            where: { sessionId },
            select: { payload: true },
        });
        if ((row === null || row === void 0 ? void 0 : row.payload) && (0, session_goa_types_1.isSessionGoaPayload)(row.payload)) {
            if (row.payload.updatedAt !== expectedUpdatedAt) {
                return false;
            }
        }
        await this.save(sessionId, payload);
        return true;
    }
    async delete(sessionId) {
        await this.prisma.sessionGoaMemory.deleteMany({ where: { sessionId } });
        await this.invalidateCache(sessionId);
    }
    async readFromDb(sessionId) {
        const row = await this.prisma.sessionGoaMemory.findUnique({
            where: { sessionId },
            select: { payload: true },
        });
        if (!(row === null || row === void 0 ? void 0 : row.payload) || !(0, session_goa_types_1.isSessionGoaPayload)(row.payload)) {
            return null;
        }
        if (row.payload.sessionId !== sessionId) {
            this.logger.warn(`session GOA payload sessionId mismatch expected=${sessionId} got=${row.payload.sessionId}`);
            return null;
        }
        return (0, session_goa_types_1.normalizeSessionGoaPayload)(row.payload);
    }
    async syncCacheFromDb(sessionId, fromDb) {
        const cached = await this.readCache(sessionId);
        if (!cached || cached.updatedAt !== fromDb.updatedAt) {
            await this.writeCache(sessionId, fromDb);
        }
    }
    async migrateFromLegacyRedis(sessionId) {
        const raw = await this.sessionContextStore.get(sessionId);
        if (!raw || !(0, session_context_types_1.isSessionContextPayload)(raw)) {
            return null;
        }
        const legacy = raw;
        const hasLegacyGoa = (Array.isArray(legacy.recentEpisodes) && legacy.recentEpisodes.length > 0) ||
            (Array.isArray(legacy.sessionArtifacts) && legacy.sessionArtifacts.length > 0) ||
            legacy.taskState != null ||
            legacy.resumeTaskPlan != null ||
            (Array.isArray(legacy.observationSnapshots) &&
                legacy.observationSnapshots.length > 0) ||
            legacy.workingMemory != null;
        if (!hasLegacyGoa) {
            return null;
        }
        this.logger.log(`migrating legacy GOA from redis sessionId=${sessionId}`);
        const migrated = (0, session_goa_migrate_util_1.migrateLegacyContextToGoa)(sessionId, legacy);
        await this.sessionContextStore.tryPatchMerge(sessionId, (current) => (0, session_goa_legacy_cleanup_util_1.stripLegacyGoaFieldsFromContext)(current));
        return migrated;
    }
    async readCache(sessionId) {
        const client = this.redis.getClient();
        if (!client) {
            return null;
        }
        const raw = await client.get((0, redis_keys_1.sessionGoaCacheKey)(sessionId));
        if (!raw) {
            return null;
        }
        try {
            const parsed = JSON.parse(raw);
            if ((0, session_goa_types_1.isSessionGoaPayload)(parsed) && parsed.sessionId === sessionId) {
                return (0, session_goa_types_1.normalizeSessionGoaPayload)(parsed);
            }
        }
        catch (_a) {
            return null;
        }
        return null;
    }
    async writeCache(sessionId, payload) {
        const client = this.redis.getClient();
        if (!client) {
            return;
        }
        const ttl = (0, memory_constants_1.getDefaultSessionContextTtlSec)();
        await client.set((0, redis_keys_1.sessionGoaCacheKey)(sessionId), JSON.stringify(payload), 'EX', ttl);
    }
    async invalidateCache(sessionId) {
        const client = this.redis.getClient();
        if (!client) {
            return;
        }
        await client.del((0, redis_keys_1.sessionGoaCacheKey)(sessionId));
    }
};
SessionGoaStore = SessionGoaStore_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_connection_service_1.RedisConnectionService,
        session_context_store_1.SessionContextStore,
        session_goa_replay_service_1.SessionGoaReplayService])
], SessionGoaStore);
exports.SessionGoaStore = SessionGoaStore;
//# sourceMappingURL=session-goa.store.js.map