import { randomUUID } from 'node:crypto';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  Optional,
  forwardRef,
} from '@nestjs/common';
import { SessionRunStateStore } from '../memory/session-run/session-run-state.store';
import { WriteConfirmationPort } from './write-confirmation.port';
import { RunEventPublisher } from './run-event.publisher';
import type { AgentRunLauncher } from './agent-run-launcher.service';
import type { SessionRunJobQueueService } from './session-run-job-queue.service';
import { AgentRunAbortedError } from './run-aborted.error';
import { RunCancellationToken } from './run-cancellation-token';
import { RunExecutionScope } from './run-execution.scope';
import type {
  CancelSessionRunResult,
  RunEnqueuePolicy,
  RunExecutionHandle,
  RunJob,
  RunJobKind,
  SessionRunStateSnapshot,
  SessionRunSupersedeEvent,
  SupersedeReason,
} from './session-run.types';
import { runWithSessionDrainLock } from './session-run-drain-lock.util';

type ActiveRunHandle = {
  runId: number;
  turnId: number;
  userId: number;
  generation: number;
  token: RunCancellationToken;
};

type DrainingRunHandle = {
  userId: number;
  generation: number;
  token: RunCancellationToken;
};

type SessionQueueState = {
  generation: number;
  active: ActiveRunHandle | null;
  draining: DrainingRunHandle | null;
  pending: RunJob[];
  drainingLock: boolean;
  lastSupersedeReason: SupersedeReason | null;
};

@Injectable()
export class SessionRunCoordinator implements OnModuleInit {
  private readonly logger = new Logger(SessionRunCoordinator.name);
  private readonly sessions = new Map<string, SessionQueueState>();
  /** 本进程 run 绑定缓存（与 Redis HASH 同步）。 */
  private readonly runGenerations = new Map<string, number>();

  constructor(
    private readonly runState: SessionRunStateStore,
    private readonly writeConfirmation: WriteConfirmationPort,
    private readonly runEvents: RunEventPublisher,
    @Inject(
      forwardRef(
        () => require('./agent-run-launcher.service').AgentRunLauncher,
      ),
    )
    private readonly launcher: AgentRunLauncher,
    @Optional()
    @Inject(
      forwardRef(
        () => require('./session-run-job-queue.service').SessionRunJobQueueService,
      ),
    )
    private readonly jobQueue?: SessionRunJobQueueService,
  ) {}

  onModuleInit(): void {
    this.runState.setRemoteSupersedeHandler((event) => {
      this.applyRemoteSupersede(event);
    });
  }

  private runKey(sessionId: string, runId: number): string {
    return `${sessionId}:${runId}`;
  }

  getGeneration(sessionId: string): number {
    const local = this.stateStoreGeneration(sessionId);
    return Math.max(local, this.runState.getGenerationLocal(sessionId));
  }

  isGenerationPublishable(sessionId: string, generation: number): boolean {
    return this.getGeneration(sessionId) === generation;
  }

  async getRunState(sessionId: string): Promise<SessionRunStateSnapshot> {
    await this.syncGenerationFromStore(sessionId);
    const state = this.sessions.get(sessionId);
    const remoteActive = await this.runState.getActiveSnapshot(sessionId);
    const localActive = state?.active;
    const remoteQueueLen = this.useBullMq()
      ? await this.jobQueue!.countSession(sessionId)
      : 0;
    return {
      generation: this.getGeneration(sessionId),
      activeRunId: localActive?.runId ?? remoteActive?.runId ?? null,
      activeTurnId: localActive?.turnId ?? remoteActive?.turnId ?? null,
      pendingJobCount: (state?.pending.length ?? 0) + remoteQueueLen,
      redisBacked: this.runState.isRedisBacked(),
    };
  }

  createScope(
    job: RunJob,
    generation: number,
    token: RunCancellationToken,
    supersedeReason: SupersedeReason | null,
  ): RunExecutionScope {
    return new RunExecutionScope(this, {
      sessionId: job.sessionId,
      userId: job.userId,
      generation,
      token,
      supersedeReason,
    });
  }

  beginRun(
    sessionId: string,
    input: {
      runId: number;
      turnId: number;
      userId: number;
      generation: number;
      token: RunCancellationToken;
    },
  ): void {
    void this.bindRunGeneration(sessionId, input.runId, input.generation);
    this.setActiveRun(sessionId, input);
    void this.runState.setActiveSnapshot(sessionId, {
      runId: input.runId,
      turnId: input.turnId,
      generation: input.generation,
    });
  }

  endRun(sessionId: string, runId: number): void {
    this.clearActiveRun(sessionId, runId);
    void this.unbindRunGeneration(sessionId, runId);
    void this.runState.clearActiveSnapshot(sessionId);
  }

  async evictSession(sessionId: string): Promise<void> {
    const state = this.sessions.get(sessionId);
    if (state?.active) {
      state.active.token.abort('cancel_api');
    }
    if (state?.draining) {
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
      await this.jobQueue!.clearSession(sessionId);
    }
    this.runEvents.purgeReplayForSession(sessionId);
  }

  canPublishRun(sessionId: string, runId: number): boolean {
    const bound = this.runGenerations.get(this.runKey(sessionId, runId));
    if (bound == null) {
      return false;
    }
    if (!this.isGenerationPublishable(sessionId, bound)) {
      return false;
    }
    const state = this.sessions.get(sessionId);
    const active = state?.active;
    if (active?.runId === runId && active.token.isAborted) {
      return false;
    }
    return true;
  }

  getBoundRunGeneration(sessionId: string, runId: number): number | null {
    return (
      this.runGenerations.get(this.runKey(sessionId, runId)) ??
      this.runState.getBoundRunGenerationLocal(sessionId, runId)
    );
  }

  getRunAbortSignal(sessionId: string, runId: number): AbortSignal | undefined {
    const state = this.sessions.get(sessionId);
    if (state?.active) {
      return state.active.runId === runId
        ? state.active.token.abortSignal
        : undefined;
    }
    if (state?.draining) {
      return state.draining.token.abortSignal;
    }
    return undefined;
  }

  assertExecutionActive(
    sessionId: string,
    handle: RunExecutionHandle,
    runId = 0,
  ): void {
    const currentGen = this.getGeneration(sessionId);
    if (currentGen !== handle.generation) {
      throw new AgentRunAbortedError(sessionId, runId, 'superseded');
    }
    handle.token.throwIfAborted({ sessionId, runId });
  }

  throwIfAborted(
    sessionId: string,
    runId: number,
    generation: number,
  ): void {
    const state = this.sessions.get(sessionId);
    if (!state) {
      return;
    }
    const tokenAborted =
      (state.active?.runId === runId && state.active.token.isAborted) ||
      (state.draining?.generation === generation &&
        state.draining.token.isAborted);
    if (this.getGeneration(sessionId) !== generation || tokenAborted) {
      const reason =
        tokenAborted && state.lastSupersedeReason === 'cancel_api'
          ? 'cancelled'
          : 'superseded';
      throw new AgentRunAbortedError(sessionId, runId, reason);
    }
  }

  buildJob(input: {
    kind: RunJobKind;
    sessionId: string;
    userId: number;
    appClientId: number;
    userMessageId?: number;
    input: string;
    requestedSkillId?: number;
    pageContext?: RunJob['pageContext'];
    writeGateDecision?: RunJob['writeGateDecision'];
  }): RunJob {
    return {
      jobId: randomUUID(),
      kind: input.kind,
      sessionId: input.sessionId,
      userId: input.userId,
      appClientId: input.appClientId,
      userMessageId: input.userMessageId,
      input: input.input,
      requestedSkillId: input.requestedSkillId,
      pageContext: input.pageContext ?? null,
      writeGateDecision: input.writeGateDecision ?? null,
    };
  }

  /** 入队 generation 已落后则跳过（在抢 drain lock 前调用，省 Worker 槽位）。 */
  async shouldSkipQueuedJob(job: RunJob): Promise<boolean> {
    await this.syncGenerationFromStore(job.sessionId);
    const state = this.getState(job.sessionId);
    if (
      job.enqueueGeneration != null &&
      job.enqueueGeneration !== state.generation
    ) {
      this.logger.debug(
        `skip stale session run job sessionId=${job.sessionId} jobId=${job.jobId} enqueueGeneration=${job.enqueueGeneration} current=${state.generation}`,
      );
      return true;
    }
    return false;
  }

  /** BullMQ worker 或本进程 drain 消费单条 job。 */
  async processQueuedJob(job: RunJob): Promise<void> {
    const sessionId = job.sessionId;
    if (await this.shouldSkipQueuedJob(job)) {
      return;
    }
    const state = this.getState(sessionId);
    const generation = state.generation;
    const token = new RunCancellationToken();
    const supersedeReason = state.lastSupersedeReason;
    state.draining = {
      userId: job.userId,
      generation,
      token,
    };
    const scope = this.createScope(job, generation, token, supersedeReason);
    try {
      await this.launcher.execute(job, scope);
    } catch (error) {
      if (error instanceof AgentRunAbortedError) {
        return;
      }
      this.logger.warn(
        `session run job failed sessionId=${sessionId} jobId=${job.jobId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      state.draining = null;
    }
  }

  async enqueue(job: RunJob, policy: RunEnqueuePolicy): Promise<number> {
    await this.syncGenerationFromStore(job.sessionId);
    if (policy === 'supersede') {
      await this.supersede(job.sessionId, job.userId, 'user_message');
      await this.writeConfirmation.clear(job.sessionId);
    }
    job.enqueueGeneration = this.getState(job.sessionId).generation;
    if (this.useBullMq()) {
      await this.jobQueue!.enqueue(job);
    } else {
      const state = this.getState(job.sessionId);
      state.pending.push(job);
      void this.scheduleDrain(job.sessionId);
    }
    return this.getState(job.sessionId).generation;
  }

  async cancelRun(
    sessionId: string,
    userId: number,
    runId?: number,
  ): Promise<CancelSessionRunResult> {
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
      ? await this.jobQueue!.countSession(sessionId)
      : 0;
    const hadRunnableWork =
      active != null ||
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

    const cancelledRunId = active?.runId ?? remoteActive?.runId ?? null;

    const generation = await this.supersede(sessionId, userId, 'cancel_api');
    await this.writeConfirmation.clear(sessionId);

    return {
      superseded: true,
      generation,
      cancelledRunId,
    };
  }

  private applyRemoteSupersede(event: SessionRunSupersedeEvent): void {
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
      void this.jobQueue!.clearSession(event.sessionId);
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

  private stateStoreGeneration(sessionId: string): number {
    return this.sessions.get(sessionId)?.generation ?? 0;
  }

  private async syncGenerationFromStore(sessionId: string): Promise<void> {
    const previous = this.getState(sessionId).generation;
    const merged = await this.runState.hydrateGeneration(sessionId);
    const state = this.getState(sessionId);
    if (merged > previous) {
      this.applyRemoteSupersede({
        sessionId,
        generation: merged,
        reason: state.lastSupersedeReason ?? 'user_message',
      });
    } else {
      state.generation = merged;
      this.runState.setGenerationLocal(sessionId, state.generation);
    }
  }

  private async bindRunGeneration(
    sessionId: string,
    runId: number,
    generation: number,
  ): Promise<void> {
    this.runGenerations.set(this.runKey(sessionId, runId), generation);
    await this.runState.bindRunGeneration(sessionId, runId, generation);
  }

  private async unbindRunGeneration(
    sessionId: string,
    runId: number,
  ): Promise<void> {
    this.runGenerations.delete(this.runKey(sessionId, runId));
    await this.runState.unbindRunGeneration(sessionId, runId);
  }

  private setActiveRun(
    sessionId: string,
    input: {
      runId: number;
      turnId: number;
      userId: number;
      generation: number;
      token: RunCancellationToken;
    },
  ): void {
    const state = this.getState(sessionId);
    state.active = {
      runId: input.runId,
      turnId: input.turnId,
      userId: input.userId,
      generation: input.generation,
      token: input.token,
    };
  }

  private clearActiveRun(sessionId: string, runId: number): void {
    const state = this.sessions.get(sessionId);
    if (!state?.active || state.active.runId !== runId) {
      return;
    }
    state.active = null;
  }

  private async supersede(
    sessionId: string,
    userId: number,
    reason: SupersedeReason,
  ): Promise<number> {
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
      await this.jobQueue!.clearSession(sessionId);
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

  private getState(sessionId: string): SessionQueueState {
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

  private useBullMq(): boolean {
    return this.jobQueue?.isEnabled() === true;
  }

  private scheduleDrain(sessionId: string): void {
    void this.tryStartDrain(sessionId);
  }

  private async tryStartDrain(sessionId: string): Promise<void> {
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

  private finishDrain(sessionId: string): void {
    const state = this.getState(sessionId);
    state.drainingLock = false;
    if (state.pending.length > 0) {
      void this.scheduleDrain(sessionId);
    }
  }

  private async drain(sessionId: string): Promise<void> {
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
          await runWithSessionDrainLock(this.runState, sessionId, async () => {
            await this.processQueuedJob(job);
          });
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === 'SESSION_DRAIN_LOCK_NOT_ACQUIRED'
          ) {
            state.pending.unshift(job);
            break;
          }
          throw error;
        }
      } else {
        await this.processQueuedJob(job);
      }
    }
  }
}
