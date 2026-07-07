"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunCancellationToken = void 0;
const run_aborted_error_1 = require("./run-aborted.error");
class RunCancellationToken {
    constructor() {
        this.controller = new AbortController();
        this.abortReason = null;
    }
    abort(reason) {
        if (this.controller.signal.aborted) {
            return;
        }
        if (reason) {
            this.abortReason = reason;
        }
        this.controller.abort();
    }
    get isAborted() {
        return this.controller.signal.aborted;
    }
    get abortSignal() {
        return this.controller.signal;
    }
    throwIfAborted(input) {
        if (!this.isAborted) {
            return;
        }
        throw new run_aborted_error_1.AgentRunAbortedError(input.sessionId, input.runId, this.abortReason === 'cancel_api' ? 'cancelled' : 'superseded');
    }
}
exports.RunCancellationToken = RunCancellationToken;
//# sourceMappingURL=run-cancellation-token.js.map