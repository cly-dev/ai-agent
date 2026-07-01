"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLegacyContextToGoa = void 0;
const session_goa_ledger_util_1 = require("./session-goa-ledger.util");
const session_goa_types_1 = require("./session-goa.types");
function asRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }
    return value;
}
function migrateEpisodes(raw) {
    if (!Array.isArray(raw)) {
        return [];
    }
    return raw.filter((row) => {
        const item = asRecord(row);
        return (item != null &&
            typeof item.turnId === 'number' &&
            typeof item.goal === 'string');
    });
}
function migrateArtifacts(raw) {
    if (!Array.isArray(raw)) {
        return [];
    }
    return raw.filter((row) => {
        const item = asRecord(row);
        return item != null && typeof item.id === 'string';
    });
}
function migrateObservationLog(raw) {
    if (!Array.isArray(raw)) {
        return [];
    }
    const entries = [];
    for (const snapshot of raw) {
        const row = asRecord(snapshot);
        if (!row || !Array.isArray(row.observations)) {
            continue;
        }
        const runId = typeof row.runId === 'number' ? row.runId : 0;
        const turnId = typeof row.turnId === 'number' ? row.turnId : 0;
        const createdAt = typeof row.createdAt === 'string' ? row.createdAt : new Date().toISOString();
        for (const obs of row.observations) {
            const o = asRecord(obs);
            if (!o || typeof o.name !== 'string') {
                continue;
            }
            entries.push({
                runId,
                turnId,
                name: o.name,
                output: o.output,
                createdAt,
            });
        }
    }
    return entries;
}
function migrateActiveTask(legacy) {
    var _a, _b;
    const resumePlan = legacy.resumeTaskPlan;
    const taskState = legacy.taskState;
    if (!resumePlan || !taskState) {
        return null;
    }
    const status = (taskState.status === 'in_progress'
        ? 'in_progress'
        : taskState.status === 'awaiting_confirmation'
            ? 'awaiting_confirmation'
            : taskState.status === 'failed'
                ? 'failed'
                : 'completed');
    const stepProgress = ((_a = taskState.steps) !== null && _a !== void 0 ? _a : []).map((step) => ({
        stepId: step.stepId,
        phase: step.phase,
        kind: step.kind,
        status: step.status,
        summary: step.summary,
        artifactRef: step.artifactRef,
    }));
    return {
        taskId: `task-${taskState.turnId}-${taskState.runId}`,
        status,
        plan: resumePlan,
        stepProgress,
        observationLog: migrateObservationLog(legacy.observationSnapshots),
        startedTurnId: taskState.turnId,
        lastTurnId: taskState.turnId,
        lastRunId: taskState.runId,
        updatedAt: (_b = taskState.updatedAt) !== null && _b !== void 0 ? _b : new Date().toISOString(),
    };
}
function migrateLegacyContextToGoa(sessionId, legacy) {
    var _a, _b, _c, _d;
    const base = (0, session_goa_types_1.createEmptySessionGoaPayload)(sessionId);
    const activeTask = migrateActiveTask(legacy);
    const legacyLedger = migrateObservationLog(legacy.observationSnapshots);
    const activeLedger = (_a = activeTask === null || activeTask === void 0 ? void 0 : activeTask.observationLog) !== null && _a !== void 0 ? _a : [];
    return Object.assign(Object.assign({}, base), { recentEpisodes: migrateEpisodes(legacy.recentEpisodes), sessionArtifacts: migrateArtifacts(legacy.sessionArtifacts), sessionObservationLedger: (0, session_goa_ledger_util_1.appendSessionObservationLedger)(legacyLedger, activeLedger), activeTask, entities: Object.assign({}, ((_c = (_b = legacy.workingMemory) === null || _b === void 0 ? void 0 : _b.entities) !== null && _c !== void 0 ? _c : {})), updatedAt: (_d = legacy.updatedAt) !== null && _d !== void 0 ? _d : new Date().toISOString() });
}
exports.migrateLegacyContextToGoa = migrateLegacyContextToGoa;
//# sourceMappingURL=session-goa-migrate.util.js.map