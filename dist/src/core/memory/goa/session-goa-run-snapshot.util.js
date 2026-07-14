"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isResumableGoaSnapshot = exports.parseAgentRunGoaSnapshot = exports.buildAgentRunGoaSnapshot = void 0;
const session_graph_resume_util_1 = require("../../agent-engine/engine/main/session/session-graph-resume.util");
function asRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }
    return value;
}
function isStoredTaskPlan(value) {
    const row = asRecord(value);
    if (!row || !Array.isArray(row.steps) || row.steps.length === 0) {
        return false;
    }
    return typeof row.goal === 'string' && typeof row.originalUserRequest === 'string';
}
function isWorkflowRunState(value) {
    const row = asRecord(value);
    if (!row || !Array.isArray(row.nodes)) {
        return false;
    }
    return (typeof row.workflowId === 'number' &&
        typeof row.version === 'number' &&
        (row.currentNodeId === null || typeof row.currentNodeId === 'string') &&
        typeof row.status === 'string');
}
function buildAgentRunGoaSnapshot(input) {
    if (!input.graphState.taskPlan) {
        return null;
    }
    const storedTaskPlan = (0, session_graph_resume_util_1.toStoredTaskPlan)(input.graphState.taskPlan);
    let activeTaskStatus = 'in_progress';
    if (input.graphState.awaitingWriteConfirmation) {
        activeTaskStatus = 'awaiting_confirmation';
    }
    else if (input.runFailed) {
        activeTaskStatus = 'failed';
    }
    else if (storedTaskPlan.pendingStepIds.length === 0) {
        activeTaskStatus = 'completed';
    }
    return Object.assign(Object.assign({ storedTaskPlan,
        activeTaskStatus, intentKind: input.graphState.intentKind, awaitingWriteConfirmation: input.graphState.awaitingWriteConfirmation === true }, (input.graphState.workflowRun
        ? { workflowRun: input.graphState.workflowRun }
        : {})), { capturedAt: new Date().toISOString() });
}
exports.buildAgentRunGoaSnapshot = buildAgentRunGoaSnapshot;
function parseAgentRunGoaSnapshot(value) {
    const row = asRecord(value);
    if (!row || !isStoredTaskPlan(row.storedTaskPlan)) {
        return null;
    }
    const status = row.activeTaskStatus;
    const activeTaskStatus = status === 'in_progress' ||
        status === 'awaiting_confirmation' ||
        status === 'completed' ||
        status === 'failed' ||
        status === 'abandoned'
        ? status
        : 'in_progress';
    const intentKind = row.intentKind;
    const workflowRun = isWorkflowRunState(row.workflowRun)
        ? row.workflowRun
        : undefined;
    return Object.assign(Object.assign(Object.assign(Object.assign({ storedTaskPlan: row.storedTaskPlan, activeTaskStatus }, (intentKind === 'task' ||
        intentKind === 'smalltalk' ||
        intentKind === 'unclear'
        ? { intentKind }
        : {})), { awaitingWriteConfirmation: row.awaitingWriteConfirmation === true }), (workflowRun ? { workflowRun } : {})), (typeof row.capturedAt === 'string' ? { capturedAt: row.capturedAt } : {}));
}
exports.parseAgentRunGoaSnapshot = parseAgentRunGoaSnapshot;
function isResumableGoaSnapshot(snapshot) {
    var _a, _b;
    if (snapshot.activeTaskStatus === 'awaiting_confirmation') {
        return true;
    }
    if (snapshot.activeTaskStatus !== 'in_progress' &&
        snapshot.activeTaskStatus !== 'failed') {
        return false;
    }
    return ((_b = (_a = snapshot.storedTaskPlan) === null || _a === void 0 ? void 0 : _a.pendingStepIds.length) !== null && _b !== void 0 ? _b : 0) > 0;
}
exports.isResumableGoaSnapshot = isResumableGoaSnapshot;
//# sourceMappingURL=session-goa-run-snapshot.util.js.map