"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAgentRunAbortedError = exports.AgentRunAbortedError = void 0;
class AgentRunAbortedError extends Error {
    constructor(sessionId, runId, reason) {
        super(`Agent run aborted: sessionId=${sessionId} runId=${runId} reason=${reason}`);
        this.sessionId = sessionId;
        this.runId = runId;
        this.reason = reason;
        this.code = 'RUN_ABORTED';
        this.name = 'AgentRunAbortedError';
    }
}
exports.AgentRunAbortedError = AgentRunAbortedError;
function isAgentRunAbortedError(error) {
    return error instanceof AgentRunAbortedError;
}
exports.isAgentRunAbortedError = isAgentRunAbortedError;
//# sourceMappingURL=run-aborted.error.js.map