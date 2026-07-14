"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isActiveTaskChatResumable = exports.isActiveTaskAwaitingWriteConfirmation = exports.isSessionGoaPayload = exports.normalizeSessionGoaPayload = exports.createEmptySessionGoaPayload = void 0;
function createEmptySessionGoaPayload(sessionId) {
    return {
        sessionId,
        recentEpisodes: [],
        sessionArtifacts: [],
        sessionObservationLedger: [],
        activeTask: null,
        entities: {},
        updatedAt: new Date().toISOString(),
    };
}
exports.createEmptySessionGoaPayload = createEmptySessionGoaPayload;
function normalizeSessionGoaPayload(payload) {
    var _a;
    return Object.assign(Object.assign({}, payload), { sessionObservationLedger: Array.isArray(payload.sessionObservationLedger)
            ? payload.sessionObservationLedger
            : [], lastPageContext: (_a = payload.lastPageContext) !== null && _a !== void 0 ? _a : null });
}
exports.normalizeSessionGoaPayload = normalizeSessionGoaPayload;
function isSessionGoaPayload(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }
    const row = value;
    return (typeof row.sessionId === 'string' &&
        Array.isArray(row.recentEpisodes) &&
        Array.isArray(row.sessionArtifacts) &&
        (row.sessionObservationLedger === undefined ||
            Array.isArray(row.sessionObservationLedger)) &&
        (row.activeTask === null ||
            (typeof row.activeTask === 'object' && row.activeTask !== null)) &&
        typeof row.entities === 'object' &&
        row.entities !== null &&
        !Array.isArray(row.entities));
}
exports.isSessionGoaPayload = isSessionGoaPayload;
function isActiveTaskAwaitingWriteConfirmation(task) {
    return (task === null || task === void 0 ? void 0 : task.status) === 'awaiting_confirmation';
}
exports.isActiveTaskAwaitingWriteConfirmation = isActiveTaskAwaitingWriteConfirmation;
function isActiveTaskChatResumable(task) {
    if (!task || task.status !== 'in_progress') {
        return false;
    }
    return task.stepProgress.some((step) => step.status === 'pending' || step.status === 'running');
}
exports.isActiveTaskChatResumable = isActiveTaskChatResumable;
//# sourceMappingURL=session-goa.types.js.map