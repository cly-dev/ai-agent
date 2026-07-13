"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWithSessionDrainLock = exports.SESSION_RUN_DRAIN_LOCK_RENEW_MS = void 0;
exports.SESSION_RUN_DRAIN_LOCK_RENEW_MS = 60000;
async function runWithSessionDrainLock(runState, sessionId, fn, options) {
    if (!(options === null || options === void 0 ? void 0 : options.alreadyHeld)) {
        const acquired = await runState.acquireDrainLock(sessionId);
        if (!acquired) {
            throw new Error('SESSION_DRAIN_LOCK_NOT_ACQUIRED');
        }
    }
    const timer = setInterval(() => {
        void runState.renewDrainLock(sessionId);
    }, exports.SESSION_RUN_DRAIN_LOCK_RENEW_MS);
    try {
        await fn();
    }
    finally {
        clearInterval(timer);
        await runState.releaseDrainLock(sessionId);
    }
}
exports.runWithSessionDrainLock = runWithSessionDrainLock;
//# sourceMappingURL=session-run-drain-lock.util.js.map