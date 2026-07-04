import type { SupersedeReason } from './session-run.types';
export declare class RunCancellationToken {
    private readonly controller;
    private abortReason;
    abort(reason?: SupersedeReason): void;
    get isAborted(): boolean;
    get abortSignal(): AbortSignal;
    throwIfAborted(input: {
        sessionId: string;
        runId: number;
    }): void;
}
