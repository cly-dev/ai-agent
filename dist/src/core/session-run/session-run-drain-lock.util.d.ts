import type { SessionRunStateStore } from '../memory/session-run/session-run-state.store';
export declare const SESSION_RUN_DRAIN_LOCK_RENEW_MS = 60000;
export declare function runWithSessionDrainLock(runState: SessionRunStateStore, sessionId: string, fn: () => Promise<void>, options?: {
    alreadyHeld?: boolean;
}): Promise<void>;
