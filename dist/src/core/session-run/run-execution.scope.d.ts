import type { SessionRunCoordinator } from './session-run-coordinator.service';
import type { RunCancellationToken } from './run-cancellation-token';
import type { RunExecutionHandle, SupersedeReason } from './session-run.types';
export declare class RunExecutionScope {
    private readonly coordinator;
    readonly generation: number;
    readonly token: RunCancellationToken;
    readonly supersedeReason: SupersedeReason | null;
    readonly sessionId: string;
    readonly userId: number;
    constructor(coordinator: SessionRunCoordinator, input: {
        sessionId: string;
        userId: number;
        generation: number;
        token: RunCancellationToken;
        supersedeReason: SupersedeReason | null;
    });
    get abortSignal(): AbortSignal;
    assertActive(runId?: number): void;
    startRun(runId: number, turnId: number): void;
    endRun(runId: number): void;
    isPublishable(): boolean;
    asHandle(): RunExecutionHandle;
}
