import { AgentRunAbortedError } from './run-aborted.error';
import { RunCancellationToken } from './run-cancellation-token';
import { RunEventPublisher } from './run-event.publisher';
import { WriteConfirmationPort } from './write-confirmation.port';
import { AgentRunLauncher } from './agent-run-launcher.service';
import { SessionRunCoordinator } from './session-run-coordinator.service';
import type { RunExecutionScope } from './run-execution.scope';
import type { RunJob } from './session-run.types';
import type { SessionRunStateStore } from '../memory/session-run/session-run-state.store';

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('SessionRunCoordinator', () => {
  const sessionId = 'session-1';
  const userId = 42;

  let writeConfirmation: jest.Mocked<WriteConfirmationPort>;
  let runEvents: jest.Mocked<RunEventPublisher>;
  let launcher: jest.Mocked<Pick<AgentRunLauncher, 'execute'>>;
  let runState: jest.Mocked<SessionRunStateStore>;
  let coordinator: SessionRunCoordinator;
  const generationBySession = new Map<string, number>();

  const flushMicrotasks = () => new Promise<void>((r) => setImmediate(r));

  beforeEach(() => {
    generationBySession.clear();
    writeConfirmation = {
      clear: jest.fn().mockResolvedValue(undefined),
    };
    runEvents = {
      purgeReplayForSession: jest.fn(),
      purgeWriteConfirmationGate: jest.fn(),
      emitRunAborted: jest.fn(),
      emitAgentRunError: jest.fn(),
      emitAgentRunComplete: jest.fn(),
      emitConfirmationRequired: jest.fn(),
      emitWriteConfirmationCancelled: jest.fn(),
      emitThink: jest.fn(),
      emitAgentRunMessage: jest.fn(),
      emitHostAction: jest.fn(),
    };
    launcher = {
      execute: jest.fn().mockResolvedValue(undefined),
    };
    runState = {
      hydrateGeneration: jest.fn(async (sid: string) => {
        return generationBySession.get(sid) ?? 0;
      }),
      getGenerationLocal: jest.fn(
        (sid: string) => generationBySession.get(sid) ?? 0,
      ),
      setGenerationLocal: jest.fn((sid: string, gen: number) => {
        generationBySession.set(sid, gen);
      }),
      incrementGeneration: jest.fn(async (sid: string) => {
        const next = (generationBySession.get(sid) ?? 0) + 1;
        generationBySession.set(sid, next);
        return next;
      }),
      bindRunGeneration: jest.fn().mockResolvedValue(undefined),
      unbindRunGeneration: jest.fn().mockResolvedValue(undefined),
      getBoundRunGenerationLocal: jest.fn().mockReturnValue(null),
      getBoundRunGeneration: jest.fn().mockResolvedValue(null),
      setActiveSnapshot: jest.fn().mockResolvedValue(undefined),
      clearActiveSnapshot: jest.fn().mockResolvedValue(undefined),
      getActiveSnapshot: jest.fn().mockResolvedValue(null),
      evictSession: jest.fn(async (sid: string) => {
        generationBySession.delete(sid);
      }),
      isRedisBacked: jest.fn().mockReturnValue(false),
      setRemoteSupersedeHandler: jest.fn(),
      publishSupersedeEvent: jest.fn().mockResolvedValue(undefined),
      clearLegacySessionQueue: jest.fn().mockResolvedValue(undefined),
      acquireDrainLock: jest.fn().mockResolvedValue(true),
      renewDrainLock: jest.fn().mockResolvedValue(true),
      releaseDrainLock: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<SessionRunStateStore>;
    coordinator = new SessionRunCoordinator(
      runState,
      writeConfirmation,
      runEvents,
      launcher as unknown as AgentRunLauncher,
    );
    coordinator.onModuleInit();
  });

  function chatJob(overrides: Partial<RunJob> = {}): RunJob {
    return coordinator.buildJob({
      kind: 'chat_turn',
      sessionId,
      userId,
      appClientId: 1,
      userMessageId: 100,
      input: 'hello',
      ...overrides,
    });
  }

  async function drainUntilIdle(): Promise<void> {
    for (let i = 0; i < 20; i += 1) {
      await flushMicrotasks();
    }
  }

  describe('enqueue', () => {
    it('supersede bumps generation, clears write confirmation, and drains job', async () => {
      const job = chatJob();
      const generation = await coordinator.enqueue(job, 'supersede');

      expect(generation).toBe(1);
      expect(coordinator.getGeneration(sessionId)).toBe(1);
      expect(writeConfirmation.clear).toHaveBeenCalledWith(sessionId);
      expect(runEvents.purgeReplayForSession).toHaveBeenCalledWith(sessionId);

      await drainUntilIdle();

      expect(launcher.execute).toHaveBeenCalledTimes(1);
      const [executedJob, scope] = launcher.execute.mock.calls[0];
      expect(executedJob.jobId).toBe(job.jobId);
      expect(scope.generation).toBe(1);
    });

    it('queue policy does not bump generation or clear write confirmation', async () => {
      const generation = await coordinator.enqueue(chatJob(), 'queue');

      expect(generation).toBe(0);
      expect(writeConfirmation.clear).not.toHaveBeenCalled();
      expect(runEvents.purgeReplayForSession).not.toHaveBeenCalled();

      await drainUntilIdle();
      expect(launcher.execute).toHaveBeenCalledTimes(1);
    });

    it('queue runs pending jobs sequentially in order', async () => {
      const order: string[] = [];
      launcher.execute.mockImplementation(async (job) => {
        order.push(job.input);
      });

      await coordinator.enqueue(chatJob({ input: 'first' }), 'queue');
      await coordinator.enqueue(chatJob({ input: 'second' }), 'queue');
      await drainUntilIdle();

      expect(order).toEqual(['first', 'second']);
      expect(launcher.execute).toHaveBeenCalledTimes(2);
    });

    it('supersede aborts active run token and clears pending queue', async () => {
      const firstHold = deferred<void>();
      const executedInputs: string[] = [];

      launcher.execute.mockImplementation(async (job, scope) => {
        executedInputs.push(job.input);
        if (job.input === 'slow') {
          scope.startRun(10, 20);
          await firstHold.promise;
        }
      });

      await coordinator.enqueue(chatJob({ input: 'slow' }), 'supersede');
      await flushMicrotasks();

      const firstScope = launcher.execute.mock.calls[0][1] as RunExecutionScope;
      expect(firstScope.generation).toBe(1);
      expect(coordinator.canPublishRun(sessionId, 10)).toBe(true);

      await coordinator.enqueue(chatJob({ input: 'fast' }), 'supersede');
      expect(firstScope.token.isAborted).toBe(true);
      expect(coordinator.canPublishRun(sessionId, 10)).toBe(false);
      expect(coordinator.getGeneration(sessionId)).toBe(2);

      firstHold.resolve();
      await drainUntilIdle();

      expect(executedInputs).toEqual(['slow', 'fast']);
    });
  });

  describe('cancelRun', () => {
    it('returns not superseded when there is no runnable work', async () => {
      const result = await coordinator.cancelRun(sessionId, userId);

      expect(result).toEqual({
        superseded: false,
        generation: 0,
        cancelledRunId: null,
      });
      expect(runEvents.emitRunAborted).not.toHaveBeenCalled();
    });

    it('returns not superseded when runId does not match active run', async () => {
      const hold = deferred<void>();
      launcher.execute.mockImplementation(async (_job, scope) => {
        scope.startRun(99, 1);
        await hold.promise;
      });

      await coordinator.enqueue(chatJob(), 'supersede');
      await flushMicrotasks();

      const result = await coordinator.cancelRun(sessionId, userId, 100);

      expect(result.superseded).toBe(false);
      expect(result.cancelledRunId).toBeNull();
      expect(runEvents.emitRunAborted).not.toHaveBeenCalled();

      hold.resolve();
      await drainUntilIdle();
    });

    it('supersedes active run and clears write confirmation without SSE', async () => {
      const hold = deferred<void>();
      let activeScope: RunExecutionScope | undefined;

      launcher.execute.mockImplementation(async (_job, scope) => {
        activeScope = scope;
        scope.startRun(55, 77);
        await hold.promise;
      });

      await coordinator.enqueue(chatJob(), 'supersede');
      await flushMicrotasks();

      const result = await coordinator.cancelRun(sessionId, userId);

      expect(result).toEqual({
        superseded: true,
        generation: 2,
        cancelledRunId: 55,
      });
      expect(activeScope?.token.isAborted).toBe(true);
      expect(writeConfirmation.clear).toHaveBeenCalledWith(sessionId);
      expect(runEvents.emitRunAborted).not.toHaveBeenCalled();

      hold.resolve();
      await drainUntilIdle();
    });
  });

  describe('generation and publish gate', () => {
    it('canPublishRun is false until run is bound', () => {
      expect(coordinator.canPublishRun(sessionId, 1)).toBe(false);
    });

    it('canPublishRun follows bound generation and abort state', async () => {
      const hold = deferred<void>();
      launcher.execute.mockImplementation(async (_job, scope) => {
        scope.startRun(7, 3);
        await hold.promise;
      });

      await coordinator.enqueue(chatJob(), 'supersede');
      await flushMicrotasks();

      expect(coordinator.getBoundRunGeneration(sessionId, 7)).toBe(1);
      expect(coordinator.canPublishRun(sessionId, 7)).toBe(true);

      await coordinator.enqueue(chatJob({ input: 'next' }), 'supersede');
      expect(coordinator.canPublishRun(sessionId, 7)).toBe(false);

      const activeScope = launcher.execute.mock.calls[0][1] as RunExecutionScope;
      expect(activeScope.token.isAborted).toBe(true);

      hold.resolve();
      await drainUntilIdle();
    });

    it('endRun unbinds generation', async () => {
      const token = new RunCancellationToken();
      await coordinator.enqueue(chatJob(), 'supersede');
      coordinator.beginRun(sessionId, {
        runId: 8,
        turnId: 4,
        userId,
        generation: 1,
        token,
      });

      expect(coordinator.canPublishRun(sessionId, 8)).toBe(true);

      coordinator.endRun(sessionId, 8);
      expect(coordinator.getBoundRunGeneration(sessionId, 8)).toBeNull();
      expect(coordinator.canPublishRun(sessionId, 8)).toBe(false);

      await drainUntilIdle();
    });
  });

  describe('abort checks', () => {
    it('assertExecutionActive throws when generation mismatches', async () => {
      const hold = deferred<void>();
      let capturedScope: RunExecutionScope | undefined;

      launcher.execute.mockImplementation(async (_job, scope) => {
        capturedScope = scope;
        await hold.promise;
      });

      await coordinator.enqueue(chatJob(), 'supersede');
      await flushMicrotasks();
      await coordinator.enqueue(chatJob({ input: 'bump' }), 'supersede');

      expect(() =>
        coordinator.assertExecutionActive(
          sessionId,
          capturedScope!.asHandle(),
          9,
        ),
      ).toThrow(AgentRunAbortedError);

      hold.resolve();
      await drainUntilIdle();
    });

    it('throwIfAborted uses cancelled reason after cancel_api supersede', async () => {
      const hold = deferred<void>();
      launcher.execute.mockImplementation(async (_job, scope) => {
        scope.startRun(11, 1);
        await hold.promise;
      });

      await coordinator.enqueue(chatJob(), 'supersede');
      await flushMicrotasks();
      await coordinator.cancelRun(sessionId, userId);

      try {
        coordinator.throwIfAborted(sessionId, 11, 1);
        fail('expected throwIfAborted to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(AgentRunAbortedError);
        expect((error as AgentRunAbortedError).reason).toBe('cancelled');
      }

      hold.resolve();
      await drainUntilIdle();
    });

    it('getRunAbortSignal returns active token during held run', async () => {
      const hold = deferred<void>();
      let capturedScope: RunExecutionScope | undefined;

      launcher.execute.mockImplementation(async (_job, scope) => {
        capturedScope = scope;
        scope.startRun(20, 2);
        await hold.promise;
      });

      await coordinator.enqueue(chatJob(), 'supersede');
      await flushMicrotasks();

      expect(coordinator.getRunAbortSignal(sessionId, 20)).toBe(
        capturedScope?.token.abortSignal,
      );

      hold.resolve();
      await drainUntilIdle();
    });
  });

  describe('evictSession', () => {
    it('aborts handles, clears bindings, and purges replay', async () => {
      const hold = deferred<void>();
      let capturedScope: RunExecutionScope | undefined;

      launcher.execute.mockImplementation(async (_job, scope) => {
        capturedScope = scope;
        scope.startRun(30, 5);
        await hold.promise;
      });

      await coordinator.enqueue(chatJob(), 'supersede');
      await flushMicrotasks();

      await coordinator.evictSession(sessionId);

      expect(capturedScope?.token.isAborted).toBe(true);
      expect(coordinator.getBoundRunGeneration(sessionId, 30)).toBeNull();
      expect(coordinator.getGeneration(sessionId)).toBe(0);
      expect(runEvents.purgeReplayForSession).toHaveBeenCalledWith(sessionId);

      hold.resolve();
    });
  });

  describe('remote supersede', () => {
    it('aborts active run when hydrate returns higher generation', async () => {
      const hold = deferred<void>();
      let capturedScope: RunExecutionScope | undefined;

      launcher.execute.mockImplementation(async (_job, scope) => {
        capturedScope = scope;
        scope.startRun(99, 1);
        await hold.promise;
      });

      await coordinator.enqueue(chatJob(), 'supersede');
      await flushMicrotasks();

      runState.hydrateGeneration.mockResolvedValueOnce(5);
      await coordinator.enqueue(chatJob({ input: 'bump-remote' }), 'queue');

      expect(capturedScope?.token.isAborted).toBe(true);

      hold.resolve();
      await drainUntilIdle();
    });
  });
});
