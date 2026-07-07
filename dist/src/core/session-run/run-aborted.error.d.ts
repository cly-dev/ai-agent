export type RunAbortReason = 'cancelled' | 'superseded';
export declare class AgentRunAbortedError extends Error {
    readonly sessionId: string;
    readonly runId: number;
    readonly reason: RunAbortReason;
    readonly code: "RUN_ABORTED";
    constructor(sessionId: string, runId: number, reason: RunAbortReason);
}
export declare function isAgentRunAbortedError(error: unknown): error is AgentRunAbortedError;
