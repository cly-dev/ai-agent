import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  forwardRef,
} from '@nestjs/common';
import { DelayedError, Queue, Worker } from 'bullmq';
import { REDIS_KEY_PREFIX } from '../memory/shared/memory.constants';
import { SessionRunStateStore } from '../memory/session-run/session-run-state.store';
import type { SessionRunCoordinator } from './session-run-coordinator.service';
import type { RunJob } from './session-run.types';
import {
  buildSessionRunBullMqConnection,
  readSessionRunJobAttempts,
  readSessionRunWorkerConcurrency,
  readSessionRunWorkerEnabled,
} from './session-run-bullmq.connection.util';
import { runWithSessionDrainLock } from './session-run-drain-lock.util';

const BULLMQ_PREFIX = `${REDIS_KEY_PREFIX}bullmq`;
const QUEUE_NAME = 'session-run';

/** BullMQ 中尚未完成、且属于某 session 的 job 状态。 */
const SESSION_PENDING_JOB_STATES = [
  'wait',
  'delayed',
  'prioritized',
  'active',
] as const;

export type SessionRunBullMqJobData = {
  runJob: RunJob;
};

const SESSION_LOCK_RETRY_MS = 300;

@Injectable()
export class SessionRunJobQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SessionRunJobQueueService.name);
  private queue: Queue<SessionRunBullMqJobData> | null = null;
  private worker: Worker<SessionRunBullMqJobData> | null = null;

  constructor(
    private readonly runState: SessionRunStateStore,
    @Inject(
      forwardRef(
        () => require('./session-run-coordinator.service').SessionRunCoordinator,
      ),
    )
    private readonly coordinator: SessionRunCoordinator,
  ) {}

  onModuleInit(): void {
    const connection = buildSessionRunBullMqConnection();
    if (!connection) {
      this.logger.warn(
        'Session run BullMQ disabled — REDIS_URL / REDIS_HOST not set; using in-memory queue',
      );
      return;
    }

    this.queue = new Queue<SessionRunBullMqJobData>(QUEUE_NAME, {
      connection,
      prefix: BULLMQ_PREFIX,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 500,
        attempts: readSessionRunJobAttempts(),
        backoff: { type: 'exponential', delay: 2000 },
      },
    });

    if (!readSessionRunWorkerEnabled()) {
      this.logger.log(
        'Session run BullMQ queue ready (producer-only; SESSION_RUN_WORKER_ENABLED=0)',
      );
      return;
    }

    const concurrency = readSessionRunWorkerConcurrency();
    this.worker = new Worker<SessionRunBullMqJobData>(
      QUEUE_NAME,
      async (bullJob) => {
        const runJob = bullJob.data.runJob;
        if (await this.coordinator.shouldSkipQueuedJob(runJob)) {
          return;
        }
        const acquired = await this.runState.acquireDrainLock(runJob.sessionId);
        if (!acquired) {
          await bullJob.moveToDelayed(Date.now() + SESSION_LOCK_RETRY_MS);
          throw new DelayedError();
        }
        await runWithSessionDrainLock(
          this.runState,
          runJob.sessionId,
          async () => {
            await this.coordinator.processQueuedJob(runJob);
          },
          { alreadyHeld: true },
        );
      },
      {
        connection,
        prefix: BULLMQ_PREFIX,
        concurrency,
      },
    );

    this.worker.on('failed', (job, error) => {
      if (error instanceof DelayedError) {
        return;
      }
      this.logger.warn(
        `session run bullmq job failed jobId=${job?.id ?? 'unknown'}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    });

    this.logger.log(
      `Session run BullMQ worker started (concurrency=${concurrency})`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
    this.worker = null;
    this.queue = null;
  }

  isEnabled(): boolean {
    return this.queue != null;
  }

  async enqueue(job: RunJob): Promise<void> {
    if (!this.queue) {
      throw new Error('Session run BullMQ queue is not configured');
    }
    await this.queue.add(
      'run',
      { runJob: job },
      { jobId: job.jobId },
    );
  }

  private async listSessionJobs(sessionId: string) {
    if (!this.queue) {
      return [];
    }
    const jobs = await this.queue.getJobs([...SESSION_PENDING_JOB_STATES]);
    return jobs.filter((row) => row.data.runJob.sessionId === sessionId);
  }

  async clearSession(sessionId: string): Promise<void> {
    if (!this.queue) {
      return;
    }
    const jobs = await this.listSessionJobs(sessionId);
    await Promise.all(
      jobs.map(async (row) => {
        try {
          await row.remove();
        } catch (error) {
          this.logger.debug(
            `session run bullmq job remove skipped jobId=${row.id}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }),
    );
  }

  async countSession(sessionId: string): Promise<number> {
    if (!this.queue) {
      return 0;
    }
    return (await this.listSessionJobs(sessionId)).length;
  }
}
