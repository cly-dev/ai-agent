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
  readSessionRunWorkerConcurrency,
} from './session-run-bullmq.connection.util';

const BULLMQ_PREFIX = `${REDIS_KEY_PREFIX}bullmq`;
const QUEUE_NAME = 'session-run';

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
        removeOnFail: 100,
        attempts: 1,
      },
    });

    const concurrency = readSessionRunWorkerConcurrency();
    this.worker = new Worker<SessionRunBullMqJobData>(
      QUEUE_NAME,
      async (bullJob) => {
        const runJob = bullJob.data.runJob;
        const acquired = await this.runState.acquireDrainLock(runJob.sessionId);
        if (!acquired) {
          await bullJob.moveToDelayed(Date.now() + SESSION_LOCK_RETRY_MS);
          throw new DelayedError();
        }
        try {
          await this.coordinator.processQueuedJob(runJob);
        } finally {
          await this.runState.releaseDrainLock(runJob.sessionId);
        }
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

  async clearSession(sessionId: string): Promise<void> {
    if (!this.queue) {
      return;
    }
    const jobs = await this.queue.getJobs(['wait', 'delayed', 'prioritized']);
    await Promise.all(
      jobs
        .filter((row) => row.data.runJob.sessionId === sessionId)
        .map((row) => row.remove()),
    );
  }

  async countSession(sessionId: string): Promise<number> {
    if (!this.queue) {
      return 0;
    }
    const jobs = await this.queue.getJobs(['wait', 'delayed', 'prioritized']);
    return jobs.filter((row) => row.data.runJob.sessionId === sessionId).length;
  }
}
