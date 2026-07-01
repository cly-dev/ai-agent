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
var ChatEventsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatEventsService = void 0;
const node_crypto_1 = require("node:crypto");
const node_os_1 = require("node:os");
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const redis_keys_1 = require("../../core/memory/redis/redis-keys");
const redis_connection_service_1 = require("../../core/memory/redis/redis-connection.service");
const host_tool_stream_replay_util_1 = require("../../core/host-bridge/host-tool-stream-replay.util");
const write_confirmation_gate_util_1 = require("../../core/agent-engine/engine/write-confirmation-gate.util");
const pending_write_confirmation_store_1 = require("./pending-write-confirmation.store");
let ChatEventsService = ChatEventsService_1 = class ChatEventsService {
    constructor(pendingWriteConfirmationStore, redis) {
        this.pendingWriteConfirmationStore = pendingWriteConfirmationStore;
        this.redis = redis;
        this.logger = new common_1.Logger(ChatEventsService_1.name);
        this.instanceId = `${(0, node_os_1.hostname)()}:${process.pid}:${(0, node_crypto_1.randomUUID)().slice(0, 8)}`;
        this.subjects = new Map();
        this.replayBuffers = new Map();
        this.subscriber = null;
    }
    onModuleInit() {
        const isProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod';
        const client = this.redis.getClient();
        if (isProd && !client) {
            this.logger.error('CHAT SSE: Redis is not configured in production — SSE will not relay across instances. Set REDIS_URL or REDIS_HOST.');
        }
        if (!client) {
            return;
        }
        this.subscriber = client.duplicate();
        void this.subscriber
            .subscribe(redis_keys_1.CHAT_SSE_RELAY_CHANNEL)
            .then(() => {
            var _a;
            (_a = this.subscriber) === null || _a === void 0 ? void 0 : _a.on('message', (_channel, raw) => {
                this.handleRelayMessage(raw);
            });
            this.logger.log(`chat SSE relay subscribed instanceId=${this.instanceId}`);
        })
            .catch((error) => {
            this.logger.warn(`chat SSE relay subscribe failed: ${error instanceof Error ? error.message : String(error)}`);
        });
    }
    onModuleDestroy() {
        if (this.subscriber) {
            void this.subscriber.quit();
            this.subscriber = null;
        }
    }
    isRelayEnabled() {
        return this.redis.getClient() != null;
    }
    observeSession(sessionId, userId) {
        const normalized = this.normalizeSessionId(sessionId);
        const subject = this.getSubject(normalized);
        return new rxjs_1.Observable((subscriber) => {
            let inner = null;
            for (const evt of this.getReplayEvents(normalized)) {
                subscriber.next(evt);
            }
            void this.pendingWriteConfirmationStore
                .get(normalized, userId)
                .then((pending) => {
                if (pending) {
                    subscriber.next(this.buildPendingWriteConfirmationEvent(pending));
                }
                inner = subject.subscribe({
                    next: (evt) => subscriber.next(evt),
                    error: (err) => subscriber.error(err),
                    complete: () => subscriber.complete(),
                });
            })
                .catch((err) => subscriber.error(err));
            return () => inner === null || inner === void 0 ? void 0 : inner.unsubscribe();
        });
    }
    emit(sessionId, evt, options) {
        const normalized = this.normalizeSessionId(sessionId);
        this.deliverLocal(normalized, evt);
        if (!(options === null || options === void 0 ? void 0 : options.fromRelay)) {
            void this.publishRelay({
                kind: 'event',
                originInstanceId: this.instanceId,
                sessionId: normalized,
                evt,
            });
        }
    }
    deliverLocal(sessionId, evt) {
        var _a;
        if (this.shouldBufferForReplay(evt)) {
            const buffer = (_a = this.replayBuffers.get(sessionId)) !== null && _a !== void 0 ? _a : [];
            buffer.push(evt);
            while (buffer.length > ChatEventsService_1.REPLAY_BUFFER) {
                buffer.shift();
            }
            this.replayBuffers.set(sessionId, buffer);
        }
        if (evt.event === 'complete' && evt.payload.source === 'agent-run') {
            const runId = evt.payload.runId;
            if (typeof runId === 'number') {
                this.purgeWriteConfirmationGate(sessionId, runId);
            }
        }
        this.getSubject(sessionId).next(evt);
    }
    purgeReplayForSession(sessionId, options) {
        const normalized = this.normalizeSessionId(sessionId);
        this.replayBuffers.delete(normalized);
        if (!(options === null || options === void 0 ? void 0 : options.fromRelay)) {
            void this.publishRelay({
                kind: 'purge_replay',
                originInstanceId: this.instanceId,
                sessionId: normalized,
            });
        }
    }
    emitRunAborted(sessionId, input) {
        const normalized = this.normalizeSessionId(sessionId);
        this.emit(normalized, {
            event: 'error',
            payload: {
                message: '已停止生成。',
                code: 'RUN_CANCELLED',
                generation: input.generation,
            },
        });
        this.emit(normalized, {
            event: 'complete',
            payload: {
                source: 'agent-run',
                runId: input.runId,
                turnId: input.turnId,
                status: 'cancelled',
                generation: input.generation,
                reason: input.reason,
            },
        });
    }
    purgeWriteConfirmationGate(sessionId, runId) {
        const normalized = this.normalizeSessionId(sessionId);
        const buffer = this.replayBuffers.get(normalized);
        if (!buffer || buffer.length === 0) {
            return;
        }
        const next = buffer.filter((evt) => !this.isWriteConfirmationGateEventForRun(evt, runId));
        if (next.length !== buffer.length) {
            this.replayBuffers.set(normalized, next);
        }
    }
    closeSession(sessionId) {
        const normalized = this.normalizeSessionId(sessionId);
        const sub = this.subjects.get(normalized);
        if (sub) {
            sub.complete();
            this.subjects.delete(normalized);
        }
        this.replayBuffers.delete(normalized);
    }
    getReplayEvents(sessionId) {
        var _a;
        const buffer = (_a = this.replayBuffers.get(sessionId)) !== null && _a !== void 0 ? _a : [];
        return buffer.filter((evt) => this.shouldReplayOnConnect(evt));
    }
    shouldBufferForReplay(evt) {
        return this.shouldReplayOnConnect(evt);
    }
    shouldReplayOnConnect(evt) {
        if (evt.event === 'error') {
            return false;
        }
        if (evt.event === 'host_action') {
            return (0, host_tool_stream_replay_util_1.shouldReplayHostAction)(evt.payload);
        }
        if (evt.event === 'message' && evt.payload.source === 'agent-run') {
            const action = evt.payload.action;
            if (action === 'confirmation_required' ||
                action === 'write_confirmation_cancelled') {
                return false;
            }
        }
        return true;
    }
    isWriteConfirmationGateEventForRun(evt, runId) {
        if (evt.event !== 'message' || evt.payload.source !== 'agent-run') {
            return false;
        }
        const action = evt.payload.action;
        if (action !== 'confirmation_required' &&
            action !== 'write_confirmation_cancelled') {
            return false;
        }
        return evt.payload.runId === runId;
    }
    buildPendingWriteConfirmationEvent(pending) {
        return {
            event: 'message',
            payload: {
                source: 'agent-run',
                action: 'confirmation_required',
                runId: pending.runId,
                turnId: pending.turnId,
                message: (0, write_confirmation_gate_util_1.buildWriteConfirmationUserMessage)(),
            },
        };
    }
    normalizeSessionId(sessionId) {
        return sessionId.trim().toLowerCase();
    }
    getSubject(sessionId) {
        const normalized = this.normalizeSessionId(sessionId);
        let sub = this.subjects.get(normalized);
        if (!sub) {
            sub = new rxjs_1.Subject();
            this.subjects.set(normalized, sub);
        }
        return sub;
    }
    async publishRelay(message) {
        const client = this.redis.getClient();
        if (!client) {
            return;
        }
        try {
            await client.publish(redis_keys_1.CHAT_SSE_RELAY_CHANNEL, JSON.stringify(message));
        }
        catch (error) {
            this.logger.warn(`chat SSE relay publish failed sessionId=${message.sessionId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    handleRelayMessage(raw) {
        try {
            const message = JSON.parse(raw);
            if (typeof message.originInstanceId !== 'string' ||
                typeof message.sessionId !== 'string' ||
                (message.kind !== 'event' && message.kind !== 'purge_replay')) {
                return;
            }
            if (message.originInstanceId === this.instanceId) {
                return;
            }
            if (message.kind === 'purge_replay') {
                this.purgeReplayForSession(message.sessionId, { fromRelay: true });
                return;
            }
            if (!message.evt || typeof message.evt !== 'object') {
                return;
            }
            this.emit(message.sessionId, message.evt, { fromRelay: true });
        }
        catch (_a) {
        }
    }
};
ChatEventsService.REPLAY_BUFFER = 8;
ChatEventsService = ChatEventsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pending_write_confirmation_store_1.PendingWriteConfirmationStore,
        redis_connection_service_1.RedisConnectionService])
], ChatEventsService);
exports.ChatEventsService = ChatEventsService;
//# sourceMappingURL=chat-events.service.js.map