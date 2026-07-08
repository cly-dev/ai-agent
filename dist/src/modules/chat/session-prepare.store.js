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
var SessionPrepareStore_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionPrepareStore = void 0;
const common_1 = require("@nestjs/common");
const memory_constants_1 = require("../../core/memory/shared/memory.constants");
const redis_keys_1 = require("../../core/memory/redis/redis-keys");
const redis_connection_service_1 = require("../../core/memory/redis/redis-connection.service");
const runtime_cache_constants_1 = require("../../core/runtime-cache/runtime-cache.constants");
const session_prepare_util_1 = require("./session-prepare.util");
const SESSION_RUNTIME_SCAN_PATTERN = `${memory_constants_1.REDIS_KEY_PREFIX}runtime:session:*`;
const LEGACY_PREPARE_SCAN_PATTERN = `${memory_constants_1.REDIS_KEY_PREFIX}prepare:session:*`;
let SessionPrepareStore = SessionPrepareStore_1 = class SessionPrepareStore {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(SessionPrepareStore_1.name);
    }
    async get(sessionId, userId, appClientId, agentId, expectedRevision) {
        const snapshot = await this.getSnapshot(sessionId);
        if (!snapshot) {
            return null;
        }
        if (!(0, session_prepare_util_1.isSessionRuntimeSnapshotValid)(snapshot, {
            sessionId,
            userId,
            appClientId,
            agentId,
        })) {
            return null;
        }
        if (expectedRevision &&
            !(0, session_prepare_util_1.areSessionRuntimeRevisionsEqual)(snapshot.revision, expectedRevision)) {
            return null;
        }
        return {
            snapshot,
            tools: snapshot.tools,
            skills: snapshot.skills,
            hostToolsByPage: snapshot.hostToolsByPage,
            lastPreparedPage: snapshot.lastPreparedPage,
            revision: snapshot.revision,
        };
    }
    async trySet(input) {
        var _a, _b, _c;
        const client = this.redis.getClient();
        if (!client) {
            return false;
        }
        const existing = await this.getSnapshot(input.sessionId);
        const warmedAt = new Date().toISOString();
        const snapshot = {
            schemaVersion: 2,
            sessionId: input.sessionId,
            userId: input.userId,
            appClientId: input.appClientId,
            agentId: input.agentId,
            revision: input.revision,
            tools: input.tools,
            skills: input.skills,
            hostToolsByPage: Object.assign(Object.assign({}, ((_a = existing === null || existing === void 0 ? void 0 : existing.hostToolsByPage) !== null && _a !== void 0 ? _a : {})), ((_b = input.hostToolsByPage) !== null && _b !== void 0 ? _b : {})),
            lastPreparedPage: (_c = input.lastPreparedPage) !== null && _c !== void 0 ? _c : existing === null || existing === void 0 ? void 0 : existing.lastPreparedPage,
            warmedAt,
        };
        const ttl = (0, runtime_cache_constants_1.getSessionRuntimeCacheTtlSec)();
        await client.set((0, redis_keys_1.sessionRuntimeKey)(input.sessionId), JSON.stringify(snapshot), 'EX', ttl);
        await client.del((0, redis_keys_1.sessionPrepareKey)(input.sessionId));
        return true;
    }
    async delete(sessionId) {
        const client = this.redis.getClient();
        if (!client) {
            return;
        }
        await client.del((0, redis_keys_1.sessionRuntimeKey)(sessionId), (0, redis_keys_1.sessionPrepareKey)(sessionId));
    }
    async invalidateSnapshotsContainingToolIds(toolIds) {
        if (toolIds.length === 0) {
            return 0;
        }
        const [runtimeRemoved, legacyRemoved] = await Promise.all([
            this.scanAndInvalidate(SESSION_RUNTIME_SCAN_PATTERN, (snapshot) => (0, session_prepare_util_1.snapshotContainsAnyToolId)(snapshot.tools, toolIds)),
            this.scanAndInvalidate(LEGACY_PREPARE_SCAN_PATTERN, (snapshot) => (0, session_prepare_util_1.snapshotContainsAnyToolId)(snapshot.tools, toolIds)),
        ]);
        const removed = runtimeRemoved + legacyRemoved;
        if (removed > 0) {
            this.logger.log(`invalidated ${removed} session runtime snapshot(s) for toolIds=${toolIds.join(',')}`);
        }
        return removed;
    }
    async invalidateSnapshotsForAgent(agentId) {
        const sessionIds = new Set();
        const [runtimeRemoved, legacyRemoved] = await Promise.all([
            this.scanAndInvalidate(SESSION_RUNTIME_SCAN_PATTERN, (snapshot) => snapshot.agentId === agentId, sessionIds),
            this.scanAndInvalidate(LEGACY_PREPARE_SCAN_PATTERN, (snapshot) => snapshot.agentId === agentId, sessionIds),
        ]);
        const removed = runtimeRemoved + legacyRemoved;
        if (removed > 0) {
            this.logger.log(`invalidated ${removed} session runtime snapshot(s) for agentId=${agentId}`);
        }
        return [...sessionIds];
    }
    async scanAndInvalidate(pattern, shouldDelete, collectedSessionIds) {
        const client = this.redis.getClient();
        if (!client) {
            return 0;
        }
        let removed = 0;
        let cursor = '0';
        do {
            const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = nextCursor;
            for (const key of keys) {
                const sessionId = this.readSessionIdFromKey(key);
                if (!sessionId) {
                    continue;
                }
                const snapshot = await this.getSnapshot(sessionId);
                if (snapshot && shouldDelete(snapshot)) {
                    await client.del(key);
                    collectedSessionIds === null || collectedSessionIds === void 0 ? void 0 : collectedSessionIds.add(sessionId);
                    removed += 1;
                }
            }
        } while (cursor !== '0');
        return removed;
    }
    readSessionIdFromKey(key) {
        const prefixes = [
            `${memory_constants_1.REDIS_KEY_PREFIX}runtime:session:`,
            `${memory_constants_1.REDIS_KEY_PREFIX}prepare:session:`,
        ];
        for (const prefix of prefixes) {
            if (key.startsWith(prefix)) {
                const sessionId = key.slice(prefix.length);
                return sessionId.length > 0 ? sessionId : null;
            }
        }
        return null;
    }
    async getSnapshot(sessionId) {
        const client = this.redis.getClient();
        if (!client) {
            return null;
        }
        for (const keyFn of [redis_keys_1.sessionRuntimeKey, redis_keys_1.sessionPrepareKey]) {
            const raw = await client.get(keyFn(sessionId));
            if (raw === null) {
                continue;
            }
            const normalized = this.normalizeSnapshot(raw, sessionId);
            if (normalized) {
                return normalized;
            }
        }
        return null;
    }
    normalizeSnapshot(raw, sessionId) {
        try {
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                return null;
            }
            const row = parsed;
            if (row.sessionId !== sessionId) {
                return null;
            }
            if ('schemaVersion' in row &&
                row.schemaVersion === 2 &&
                'revision' in row &&
                row.revision) {
                return row;
            }
            return this.upgradeLegacySnapshot(row);
        }
        catch (_a) {
            this.logger.warn(`corrupt session runtime cache sessionId=${sessionId}`);
            return null;
        }
    }
    upgradeLegacySnapshot(legacy) {
        return {
            schemaVersion: 2,
            sessionId: legacy.sessionId,
            userId: legacy.userId,
            appClientId: legacy.appClientId,
            agentId: legacy.agentId,
            revision: {
                tools: legacy.toolIdsFingerprint,
                skills: legacy.skillIdsFingerprint,
                hostTools: '',
                integrations: '',
            },
            tools: legacy.tools,
            skills: legacy.skills,
            warmedAt: legacy.warmedAt,
        };
    }
};
SessionPrepareStore = SessionPrepareStore_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_connection_service_1.RedisConnectionService])
], SessionPrepareStore);
exports.SessionPrepareStore = SessionPrepareStore;
//# sourceMappingURL=session-prepare.store.js.map