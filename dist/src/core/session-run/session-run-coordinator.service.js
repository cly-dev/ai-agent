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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SessionRunCoordinator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionRunCoordinator = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const session_run_state_store_1 = require("../memory/session-run/session-run-state.store");
const write_confirmation_port_1 = require("./write-confirmation.port");
const run_event_publisher_1 = require("./run-event.publisher");
const run_aborted_error_1 = require("./run-aborted.error");
const run_cancellation_token_1 = require("./run-cancellation-token");
const run_execution_scope_1 = require("./run-execution.scope");
const session_run_drain_lock_util_1 = require("./session-run-drain-lock.util");
let SessionRunCoordinator = SessionRunCoordinator_1 = class SessionRunCoordinator {
    constructor(runState, writeConfirmation, runEvents, launcher, jobQueue) {
        this.runState = runState;
        this.writeConfirmation = writeConfirmation;
        this.runEvents = runEvents;
        this.launcher = launcher;
        this.jobQueue = jobQueue;
        this.logger = new common_1.Logger(SessionRunCoordinator_1.name);
        this.sessions = new Map();
        this.runGenerations = new Map();
    }
    onModuleInit() {
        this.runState.setRemoteSupersedeHandler((event) => {
            this.applyRemoteSupersede(event);
        });
    }
    runKey(sessionId, runId) {
        return `${sessionId}:${runId}`;
    }
    getGeneration(sessionId) {
        const local = this.stateStoreGeneration(sessionId);
        return Math.max(local, this.runState.getGenerationLocal(sessionId));
    }
    isGenerationPublishable(sessionId, generation) {
        return this.getGeneration(sessionId) === generation;
    }
    async getRunState(sessionId) {
        var _a, _b, _c, _d, _e;
        await this.syncGenerationFromStore(sessionId);
        const state = this.sessions.get(sessionId);
        const remoteActive = await this.runState.getActiveSnapshot(sessionId);
        const localActive = state === null || state === void 0 ? void 0 : state.active;
        const remoteQueueLen = this.useBullMq()
            ? await this.jobQueue.countSession(sessionId)
            : 0;
        return {
            generation: this.getGeneration(sessionId),
            activeRunId: (_b = (_a = localActive === null || localActive === void 0 ? void 0 : localActive.runId) !== null && _a !== void 0 ? _a : remoteActive === null || remoteActive === void 0 ? void 0 : remoteActive.runId) !== null && _b !== void 0 ? _b : null,
            activeTurnId: (_d = (_c = localActive === null || localActive === void 0 ? void 0 : localActive.turnId) !== null && _c !== void 0 ? _c : remoteActive === null || remoteActive === void 0 ? void 0 : remoteActive.turnId) !== null && _d !== void 0 ? _d : null,
            pendingJobCount: ((_e = state === null || state === void 0 ? void 0 : state.pending.length) !== null && _e !== void 0 ? _e : 0) + remoteQueueLen,
            redisBacked: this.runState.isRedisBacked(),
        };
    }
    createScope(job, generation, token, supersedeReason) {
        return new run_execution_scope_1.RunExecutionScope(this, {
            sessionId: job.sessionId,
            userId: job.userId,
            generation,
            token,
            supersedeReason,
        });
    }
    beginRun(sessionId, input) {
        void this.bindRunGeneration(sessionId, input.runId, input.generation);
        this.setActiveRun(sessionId, input);
        void this.runState.setActiveSnapshot(sessionId, {
            runId: input.runId,
            turnId: input.turnId,
            generation: input.generation,
        });
    }
    endRun(sessionId, runId) {
        this.clearActiveRun(sessionId, runId);
        void this.unbindRunGeneration(sessionId, runId);
        void this.runState.clearActiveSnapshot(sessionId);
    }
    async evictSession(sessionId) {
        const state = this.sessions.get(sessionId);
        if (state === null || state === void 0 ? void 0 : state.active) {
            state.active.token.abort('cancel_api');
        }
        if (state === null || state === void 0 ? void 0 : state.draining) {
            state.draining.token.abort('cancel_api');
        }
        this.sessions.delete(sessionId);
        const prefix = `${sessionId}:`;
        for (const key of this.runGenerations.keys()) {
            if (key.startsWith(prefix)) {
                this.runGenerations.delete(key);
            }
        }
        await this.runState.evictSession(sessionId);
        if (this.useBullMq()) {
            await this.jobQueue.clearSession(sessionId);
        }
        this.runEvents.purgeReplayForSession(sessionId);
    }
    canPublishRun(sessionId, runId) {
        const bound = this.runGenerations.get(this.runKey(sessionId, runId));
        if (bound == null) {
            return false;
        }
        if (!this.isGenerationPublishable(sessionId, bound)) {
            return false;
        }
        const state = this.sessions.get(sessionId);
        const active = state === null || state === void 0 ? void 0 : state.active;
        if ((active === null || active === void 0 ? void 0 : active.runId) === runId && active.token.isAborted) {
            return false;
        }
        return true;
    }
    getBoundRunGeneration(sessionId, runId) {
        var _a;
        return ((_a = this.runGenerations.get(this.runKey(sessionId, runId))) !== null && _a !== void 0 ? _a : this.runState.getBoundRunGenerationLocal(sessionId, runId));
    }
    getRunAbortSignal(sessionId, runId) {
        const state = this.sessions.get(sessionId);
        if (state === null || state === void 0 ? void 0 : state.active) {
            return state.active.runId === runId
                ? state.active.token.abortSignal
                : undefined;
        }
        if (state === null || state === void 0 ? void 0 : state.draining) {
            return state.draining.token.abortSignal;
        }
        return undefined;
    }
    assertExecutionActive(sessionId, handle, runId = 0) {
        const currentGen = this.getGeneration(sessionId);
        if (currentGen !== handle.generation) {
            throw new run_aborted_error_1.AgentRunAbortedError(sessionId, runId, 'superseded');
        }
        handle.token.throwIfAborted({ sessionId, runId });
    }
    throwIfAborted(sessionId, runId, generation) {
        var _a, _b;
        const state = this.sessions.get(sessionId);
        if (!state) {
            return;
        }
        const tokenAborted = (((_a = state.active) === null || _a === void 0 ? void 0 : _a.runId) === runId && state.active.token.isAborted) ||
            (((_b = state.draining) === null || _b === void 0 ? void 0 : _b.generation) === generation &&
                state.draining.token.isAborted);
        if (this.getGeneration(sessionId) !== generation || tokenAborted) {
            const reason = tokenAborted && state.lastSupersedeReason === 'cancel_api'
                ? 'cancelled'
                : 'superseded';
            throw new run_aborted_error_1.AgentRunAbortedError(sessionId, runId, reason);
        }
    }
    buildJob(input) {
        var _a, _b;
        return {
            jobId: (0, node_crypto_1.randomUUID)(),
            kind: input.kind,
            sessionId: input.sessionId,
            userId: input.userId,
            appClientId: input.appClientId,
            userMessageId: input.userMessageId,
            input: input.input,
            requestedSkillId: input.requestedSkillId,
            pageContext: (_a = input.pageContext) !== null && _a !== void 0 ? _a : null,
            writeGateDecision: (_b = input.writeGateDecision) !== null && _b !== void 0 ? _b : null,
        };
    }
    async shouldSkipQueuedJob(job) {
        await this.syncGenerationFromStore(job.sessionId);
        const state = this.getState(job.sessionId);
        if (job.enqueueGeneration != null &&
            job.enqueueGeneration !== state.generation) {
            this.logger.debug(`skip stale session run job sessionId=${job.sessionId} jobId=${job.jobId} enqueueGeneration=${job.enqueueGeneration} current=${state.generation}`);
            return true;
        }
        return false;
    }
    async processQueuedJob(job) {
        const sessionId = job.sessionId;
        if (await this.shouldSkipQueuedJob(job)) {
            return;
        }
        const state = this.getState(sessionId);
        const generation = state.generation;
        const token = new run_cancellation_token_1.RunCancellationToken();
        const supersedeReason = state.lastSupersedeReason;
        state.draining = {
            userId: job.userId,
            generation,
            token,
        };
        const scope = this.createScope(job, generation, token, supersedeReason);
        try {
            await this.launcher.execute(job, scope);
        }
        catch (error) {
            if (error instanceof run_aborted_error_1.AgentRunAbortedError) {
                return;
            }
            this.logger.warn(`session run job failed sessionId=${sessionId} jobId=${job.jobId}: ${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            state.draining = null;
        }
    }
    async enqueue(job, policy) {
        await this.syncGenerationFromStore(job.sessionId);
        if (policy === 'supersede') {
            await this.supersede(job.sessionId, job.userId, 'user_message');
            await this.writeConfirmation.clear(job.sessionId);
        }
        job.enqueueGeneration = this.getState(job.sessionId).generation;
        if (this.useBullMq()) {
            await this.jobQueue.enqueue(job);
        }
        else {
            const state = this.getState(job.sessionId);
            state.pending.push(job);
            void this.scheduleDrain(job.sessionId);
        }
        return this.getState(job.sessionId).generation;
    }
    async cancelRun(sessionId, userId, runId) {
        var _a, _b;
        await this.syncGenerationFromStore(sessionId);
        const state = this.getState(sessionId);
        const active = state.active;
        if (runId != null && active != null && active.runId !== runId) {
            return {
                superseded: false,
                generation: state.generation,
                cancelledRunId: null,
            };
        }
        const remoteActive = await this.runState.getActiveSnapshot(sessionId);
        const remoteQueueLen = this.useBullMq()
            ? await this.jobQueue.countSession(sessionId)
            : 0;
        const hadRunnableWork = active != null ||
            state.draining != null ||
            state.pending.length > 0 ||
            remoteQueueLen > 0 ||
            remoteActive != null;
        if (!hadRunnableWork) {
            return {
                superseded: false,
                generation: state.generation,
                cancelledRunId: null,
            };
        }
        const cancelledRunId = (_b = (_a = active === null || active === void 0 ? void 0 : active.runId) !== null && _a !== void 0 ? _a : remoteActive === null || remoteActive === void 0 ? void 0 : remoteActive.runId) !== null && _b !== void 0 ? _b : null;
        const generation = await this.supersede(sessionId, userId, 'cancel_api');
        await this.writeConfirmation.clear(sessionId);
        return {
            superseded: true,
            generation,
            cancelledRunId,
        };
    }
    applyRemoteSupersede(event) {
        const state = this.sessions.get(event.sessionId);
        if (!state) {
            this.runState.setGenerationLocal(event.sessionId, event.generation);
            return;
        }
        if (event.generation <= state.generation) {
            return;
        }
        state.generation = event.generation;
        state.lastSupersedeReason = event.reason;
        state.pending = [];
        if (this.useBullMq()) {
            void this.jobQueue.clearSession(event.sessionId);
        }
        if (state.active) {
            state.active.token.abort(event.reason);
        }
        if (state.draining) {
            state.draining.token.abort(event.reason);
        }
        this.runState.setGenerationLocal(event.sessionId, event.generation);
        this.runEvents.purgeReplayForSession(event.sessionId);
        void this.runState.clearActiveSnapshot(event.sessionId);
    }
    stateStoreGeneration(sessionId) {
        var _a, _b;
        return (_b = (_a = this.sessions.get(sessionId)) === null || _a === void 0 ? void 0 : _a.generation) !== null && _b !== void 0 ? _b : 0;
    }
    async syncGenerationFromStore(sessionId) {
        var _a;
        const previous = this.getState(sessionId).generation;
        const merged = await this.runState.hydrateGeneration(sessionId);
        const state = this.getState(sessionId);
        if (merged > previous) {
            this.applyRemoteSupersede({
                sessionId,
                generation: merged,
                reason: (_a = state.lastSupersedeReason) !== null && _a !== void 0 ? _a : 'user_message',
            });
        }
        else {
            state.generation = merged;
            this.runState.setGenerationLocal(sessionId, state.generation);
        }
    }
    async bindRunGeneration(sessionId, runId, generation) {
        this.runGenerations.set(this.runKey(sessionId, runId), generation);
        await this.runState.bindRunGeneration(sessionId, runId, generation);
    }
    async unbindRunGeneration(sessionId, runId) {
        this.runGenerations.delete(this.runKey(sessionId, runId));
        await this.runState.unbindRunGeneration(sessionId, runId);
    }
    setActiveRun(sessionId, input) {
        const state = this.getState(sessionId);
        state.active = {
            runId: input.runId,
            turnId: input.turnId,
            userId: input.userId,
            generation: input.generation,
            token: input.token,
        };
    }
    clearActiveRun(sessionId, runId) {
        const state = this.sessions.get(sessionId);
        if (!(state === null || state === void 0 ? void 0 : state.active) || state.active.runId !== runId) {
            return;
        }
        state.active = null;
    }
    async supersede(sessionId, userId, reason) {
        const state = this.getState(sessionId);
        state.lastSupersedeReason = reason;
        if (state.active && state.active.userId === userId) {
            state.active.token.abort(reason);
        }
        if (state.draining && state.draining.userId === userId) {
            state.draining.token.abort(reason);
        }
        state.pending = [];
        if (this.useBullMq()) {
            await this.jobQueue.clearSession(sessionId);
        }
        await this.runState.clearLegacySessionQueue(sessionId);
        const next = await this.runState.incrementGeneration(sessionId);
        state.generation = next;
        this.runEvents.purgeReplayForSession(sessionId);
        void this.runState.clearActiveSnapshot(sessionId);
        await this.runState.publishSupersedeEvent({
            sessionId,
            generation: next,
            reason,
        });
        return next;
    }
    getState(sessionId) {
        let state = this.sessions.get(sessionId);
        if (!state) {
            state = {
                generation: this.runState.getGenerationLocal(sessionId),
                active: null,
                draining: null,
                pending: [],
                drainingLock: false,
                lastSupersedeReason: null,
            };
            this.sessions.set(sessionId, state);
        }
        return state;
    }
    useBullMq() {
        var _a;
        return ((_a = this.jobQueue) === null || _a === void 0 ? void 0 : _a.isEnabled()) === true;
    }
    scheduleDrain(sessionId) {
        void this.tryStartDrain(sessionId);
    }
    async tryStartDrain(sessionId) {
        if (this.useBullMq()) {
            return;
        }
        const state = this.getState(sessionId);
        if (state.drainingLock) {
            return;
        }
        state.drainingLock = true;
        void this.drain(sessionId).finally(() => {
            this.finishDrain(sessionId);
        });
    }
    finishDrain(sessionId) {
        const state = this.getState(sessionId);
        state.drainingLock = false;
        if (state.pending.length > 0) {
            void this.scheduleDrain(sessionId);
        }
    }
    async drain(sessionId) {
        if (this.useBullMq()) {
            return;
        }
        await this.syncGenerationFromStore(sessionId);
        const state = this.getState(sessionId);
        while (true) {
            await this.syncGenerationFromStore(sessionId);
            const job = state.pending.shift();
            if (!job) {
                break;
            }
            if (this.runState.isRedisBacked()) {
                try {
                    await (0, session_run_drain_lock_util_1.runWithSessionDrainLock)(this.runState, sessionId, async () => {
                        await this.processQueuedJob(job);
                    });
                }
                catch (error) {
                    if (error instanceof Error &&
                        error.message === 'SESSION_DRAIN_LOCK_NOT_ACQUIRED') {
                        state.pending.unshift(job);
                        break;
                    }
                    throw error;
                }
            }
            else {
                await this.processQueuedJob(job);
            }
        }
    }
};
SessionRunCoordinator = SessionRunCoordinator_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => require('./agent-run-launcher.service').AgentRunLauncher))),
    __param(4, (0, common_1.Optional)()),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => require('./session-run-job-queue.service').SessionRunJobQueueService))),
    __metadata("design:paramtypes", [session_run_state_store_1.SessionRunStateStore,
        write_confirmation_port_1.WriteConfirmationPort,
        run_event_publisher_1.RunEventPublisher, Function, Function])
], SessionRunCoordinator);
exports.SessionRunCoordinator = SessionRunCoordinator;
//# sourceMappingURL=session-run-coordinator.service.js.map