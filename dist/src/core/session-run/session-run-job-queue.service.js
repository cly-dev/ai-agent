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
var SessionRunJobQueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionRunJobQueueService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const memory_constants_1 = require("../memory/shared/memory.constants");
const session_run_state_store_1 = require("../memory/session-run/session-run-state.store");
const session_run_bullmq_connection_util_1 = require("./session-run-bullmq.connection.util");
const BULLMQ_PREFIX = `${memory_constants_1.REDIS_KEY_PREFIX}bullmq`;
const QUEUE_NAME = 'session-run';
const SESSION_LOCK_RETRY_MS = 300;
let SessionRunJobQueueService = SessionRunJobQueueService_1 = class SessionRunJobQueueService {
    constructor(runState, coordinator) {
        this.runState = runState;
        this.coordinator = coordinator;
        this.logger = new common_1.Logger(SessionRunJobQueueService_1.name);
        this.queue = null;
        this.worker = null;
    }
    onModuleInit() {
        const connection = (0, session_run_bullmq_connection_util_1.buildSessionRunBullMqConnection)();
        if (!connection) {
            this.logger.warn('Session run BullMQ disabled — REDIS_URL / REDIS_HOST not set; using in-memory queue');
            return;
        }
        this.queue = new bullmq_1.Queue(QUEUE_NAME, {
            connection,
            prefix: BULLMQ_PREFIX,
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: 100,
                attempts: 1,
            },
        });
        const concurrency = (0, session_run_bullmq_connection_util_1.readSessionRunWorkerConcurrency)();
        this.worker = new bullmq_1.Worker(QUEUE_NAME, async (bullJob) => {
            const runJob = bullJob.data.runJob;
            const acquired = await this.runState.acquireDrainLock(runJob.sessionId);
            if (!acquired) {
                await bullJob.moveToDelayed(Date.now() + SESSION_LOCK_RETRY_MS);
                throw new bullmq_1.DelayedError();
            }
            try {
                await this.coordinator.processQueuedJob(runJob);
            }
            finally {
                await this.runState.releaseDrainLock(runJob.sessionId);
            }
        }, {
            connection,
            prefix: BULLMQ_PREFIX,
            concurrency,
        });
        this.worker.on('failed', (job, error) => {
            var _a;
            if (error instanceof bullmq_1.DelayedError) {
                return;
            }
            this.logger.warn(`session run bullmq job failed jobId=${(_a = job === null || job === void 0 ? void 0 : job.id) !== null && _a !== void 0 ? _a : 'unknown'}: ${error instanceof Error ? error.message : String(error)}`);
        });
        this.logger.log(`Session run BullMQ worker started (concurrency=${concurrency})`);
    }
    async onModuleDestroy() {
        var _a, _b;
        await ((_a = this.worker) === null || _a === void 0 ? void 0 : _a.close());
        await ((_b = this.queue) === null || _b === void 0 ? void 0 : _b.close());
        this.worker = null;
        this.queue = null;
    }
    isEnabled() {
        return this.queue != null;
    }
    async enqueue(job) {
        if (!this.queue) {
            throw new Error('Session run BullMQ queue is not configured');
        }
        await this.queue.add('run', { runJob: job }, { jobId: job.jobId });
    }
    async clearSession(sessionId) {
        if (!this.queue) {
            return;
        }
        const jobs = await this.queue.getJobs(['wait', 'delayed', 'prioritized']);
        await Promise.all(jobs
            .filter((row) => row.data.runJob.sessionId === sessionId)
            .map((row) => row.remove()));
    }
    async countSession(sessionId) {
        if (!this.queue) {
            return 0;
        }
        const jobs = await this.queue.getJobs(['wait', 'delayed', 'prioritized']);
        return jobs.filter((row) => row.data.runJob.sessionId === sessionId).length;
    }
};
SessionRunJobQueueService = SessionRunJobQueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => require('./session-run-coordinator.service').SessionRunCoordinator))),
    __metadata("design:paramtypes", [session_run_state_store_1.SessionRunStateStore, Function])
], SessionRunJobQueueService);
exports.SessionRunJobQueueService = SessionRunJobQueueService;
//# sourceMappingURL=session-run-job-queue.service.js.map