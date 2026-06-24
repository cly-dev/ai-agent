import type { SessionRunCoordinator } from './session-run-coordinator.service';
import type { RunCancellationToken } from './run-cancellation-token';
import type { RunExecutionHandle, SupersedeReason } from './session-run.types';

/** 单次 session run job 的不可变执行上下文；由 Coordinator 创建并贯穿 drain → launcher → engine。 */
export class RunExecutionScope {
  readonly generation: number;
  readonly token: RunCancellationToken;
  readonly supersedeReason: SupersedeReason | null;
  readonly sessionId: string;
  readonly userId: number;

  constructor(
    private readonly coordinator: SessionRunCoordinator,
    input: {
      sessionId: string;
      userId: number;
      generation: number;
      token: RunCancellationToken;
      supersedeReason: SupersedeReason | null;
    },
  ) {
    this.sessionId = input.sessionId;
    this.userId = input.userId;
    this.generation = input.generation;
    this.token = input.token;
    this.supersedeReason = input.supersedeReason;
  }

  get abortSignal(): AbortSignal {
    return this.token.abortSignal;
  }

  assertActive(runId = 0): void {
    this.coordinator.assertExecutionActive(
      this.sessionId,
      this.asHandle(),
      runId,
    );
  }

  startRun(runId: number, turnId: number): void {
    this.coordinator.beginRun(this.sessionId, {
      runId,
      turnId,
      userId: this.userId,
      generation: this.generation,
      token: this.token,
    });
  }

  endRun(runId: number): void {
    this.coordinator.endRun(this.sessionId, runId);
  }

  isPublishable(): boolean {
    return this.coordinator.isGenerationPublishable(
      this.sessionId,
      this.generation,
    );
  }

  asHandle(): RunExecutionHandle {
    return {
      generation: this.generation,
      token: this.token,
      supersedeReason: this.supersedeReason,
    };
  }
}
