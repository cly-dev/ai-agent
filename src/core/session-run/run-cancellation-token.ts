import { AgentRunAbortedError } from './run-aborted.error';
import type { SupersedeReason } from './session-run.types';

export class RunCancellationToken {
  private readonly controller = new AbortController();
  private abortReason: SupersedeReason | null = null;

  abort(reason?: SupersedeReason): void {
    if (this.controller.signal.aborted) {
      return;
    }
    if (reason) {
      this.abortReason = reason;
    }
    this.controller.abort();
  }

  get isAborted(): boolean {
    return this.controller.signal.aborted;
  }

  get abortSignal(): AbortSignal {
    return this.controller.signal;
  }

  throwIfAborted(input: { sessionId: string; runId: number }): void {
    if (!this.isAborted) {
      return;
    }
    throw new AgentRunAbortedError(
      input.sessionId,
      input.runId,
      this.abortReason === 'cancel_api' ? 'cancelled' : 'superseded',
    );
  }
}
