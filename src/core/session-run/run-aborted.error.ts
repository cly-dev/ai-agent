export type RunAbortReason = 'cancelled' | 'superseded';

export class AgentRunAbortedError extends Error {
  readonly code = 'RUN_ABORTED' as const;

  constructor(
    readonly sessionId: string,
    readonly runId: number,
    readonly reason: RunAbortReason,
  ) {
    super(
      `Agent run aborted: sessionId=${sessionId} runId=${runId} reason=${reason}`,
    );
    this.name = 'AgentRunAbortedError';
  }
}

export function isAgentRunAbortedError(
  error: unknown,
): error is AgentRunAbortedError {
  return error instanceof AgentRunAbortedError;
}
