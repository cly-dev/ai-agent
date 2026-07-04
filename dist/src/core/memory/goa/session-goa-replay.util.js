"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replayActiveTaskFromRuns = exports.buildActiveTaskFromGoaSnapshot = exports.buildReplayActiveTask = exports.extractObservationLogFromRunSteps = exports.extractLatestTaskPlanTraceFromSteps = void 0;
const session_goa_run_snapshot_util_1 = require("./session-goa-run-snapshot.util");
function asRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }
    return value;
}
function asStringArray(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.filter((row) => typeof row === 'string');
}
function parsePlanTrace(trace, originalUserRequest) {
    var _a, _b;
    const stepsRaw = trace.steps;
    if (!Array.isArray(stepsRaw) || stepsRaw.length === 0) {
        return null;
    }
    const steps = [];
    for (const row of stepsRaw) {
        const step = asRecord(row);
        if (!step || typeof step.id !== 'string' || typeof step.objective !== 'string') {
            continue;
        }
        steps.push(Object.assign(Object.assign(Object.assign({ id: step.id, phase: typeof step.phase === 'string' ? step.phase : 'answer', kind: typeof step.kind === 'string' ? step.kind : 'tool' }, (typeof step.toolRole === 'string' ? { toolRole: step.toolRole } : {})), { objective: step.objective }), (typeof step.stopWhen === 'string' ? { stopWhen: step.stopWhen } : {})));
    }
    if (steps.length === 0) {
        return null;
    }
    return {
        source: typeof trace.source === 'string' ? trace.source : 'minimal',
        deliverable: typeof trace.deliverable === 'string' ? trace.deliverable : 'answer',
        goal: typeof trace.goal === 'string' ? trace.goal : originalUserRequest,
        originalUserRequest,
        currentStepId: typeof trace.currentStepId === 'string' ? trace.currentStepId : null,
        currentObjective: typeof trace.currentObjective === 'string'
            ? trace.currentObjective
            : (_b = (_a = steps[0]) === null || _a === void 0 ? void 0 : _a.objective) !== null && _b !== void 0 ? _b : originalUserRequest,
        taskPhase: typeof trace.taskPhase === 'string' ? trace.taskPhase : 'answer',
        pendingStepIds: asStringArray(trace.pendingStepIds),
        completedStepIds: asStringArray(trace.completedStepIds),
        steps,
    };
}
function extractLatestTaskPlanTraceFromSteps(steps, originalUserRequest) {
    if (!Array.isArray(steps)) {
        return null;
    }
    let latest = null;
    for (const row of steps) {
        const step = asRecord(row);
        if (!step || step.type !== 'llm') {
            continue;
        }
        const output = asRecord(step.output);
        const trace = output ? asRecord(output.taskPlanTrace) : null;
        if (!trace) {
            continue;
        }
        const parsed = parsePlanTrace(trace, originalUserRequest);
        if (parsed) {
            latest = parsed;
        }
    }
    return latest;
}
exports.extractLatestTaskPlanTraceFromSteps = extractLatestTaskPlanTraceFromSteps;
function extractObservationLogFromRunSteps(input) {
    var _a;
    if (!Array.isArray(input.steps)) {
        return [];
    }
    const entries = [];
    const now = new Date().toISOString();
    for (const row of input.steps) {
        const step = asRecord(row);
        if (!step || step.type !== 'tool' || typeof step.name !== 'string') {
            continue;
        }
        const meta = asRecord(step.meta);
        const output = (_a = meta === null || meta === void 0 ? void 0 : meta.observationOutput) !== null && _a !== void 0 ? _a : (step.output != null && typeof step.output === 'object' && !Array.isArray(step.output)
            ? step.output.observation
            : step.output);
        entries.push({
            runId: input.runId,
            turnId: input.turnId,
            name: step.name,
            output,
            createdAt: now,
        });
    }
    return entries;
}
exports.extractObservationLogFromRunSteps = extractObservationLogFromRunSteps;
function resolveReplayStepStatus(stepId, trace) {
    if (trace.completedStepIds.includes(stepId)) {
        return 'done';
    }
    if (trace.pendingStepIds.includes(stepId)) {
        return trace.currentStepId === stepId ? 'running' : 'pending';
    }
    if (trace.currentStepId === stepId) {
        return 'running';
    }
    return 'pending';
}
function buildStoredPlanFromTrace(trace) {
    return {
        source: trace.source,
        originalUserRequest: trace.originalUserRequest,
        goal: trace.goal,
        deliverable: trace.deliverable,
        constraints: [],
        steps: trace.steps,
        pendingStepIds: [...trace.pendingStepIds],
        completedStepIds: [...trace.completedStepIds],
        taskPhase: trace.taskPhase,
        currentObjective: trace.currentObjective,
        currentStepId: trace.currentStepId,
    };
}
function buildReplayActiveTask(input) {
    if (input.trace.pendingStepIds.length === 0) {
        return null;
    }
    const plan = buildStoredPlanFromTrace(input.trace);
    const stepProgress = plan.steps.map((planStep) => ({
        stepId: planStep.id,
        phase: planStep.phase,
        kind: planStep.kind,
        status: resolveReplayStepStatus(planStep.id, input.trace),
    }));
    const status = input.runStatus === 'failed' ? 'failed' : 'in_progress';
    return {
        taskId: `task-${input.turnId}-${input.runId}`,
        status,
        plan,
        stepProgress,
        observationLog: input.observationLog,
        startedTurnId: input.turnId,
        lastTurnId: input.turnId,
        lastRunId: input.runId,
        updatedAt: new Date().toISOString(),
    };
}
exports.buildReplayActiveTask = buildReplayActiveTask;
function resolveStepStatusFromPlan(stepId, plan) {
    if (plan.completedStepIds.includes(stepId)) {
        return 'done';
    }
    if (plan.pendingStepIds.includes(stepId)) {
        return plan.currentStepId === stepId ? 'running' : 'pending';
    }
    if (plan.currentStepId === stepId) {
        return 'running';
    }
    return 'pending';
}
function buildActiveTaskFromGoaSnapshot(input) {
    var _a;
    const plan = input.snapshot.storedTaskPlan;
    if (!plan || plan.steps.length === 0) {
        return null;
    }
    if (!(0, session_goa_run_snapshot_util_1.isResumableGoaSnapshot)(input.snapshot)) {
        return null;
    }
    let status = input.snapshot.activeTaskStatus;
    if (input.runStatus === 'failed' && status === 'in_progress') {
        status = 'failed';
    }
    const stepProgress = plan.steps.map((planStep) => ({
        stepId: planStep.id,
        phase: planStep.phase,
        kind: planStep.kind,
        status: resolveStepStatusFromPlan(planStep.id, plan),
    }));
    return {
        taskId: `task-${input.turnId}-${input.runId}`,
        status,
        plan,
        stepProgress,
        observationLog: input.observationLog,
        startedTurnId: input.turnId,
        lastTurnId: input.turnId,
        lastRunId: input.runId,
        updatedAt: (_a = input.snapshot.capturedAt) !== null && _a !== void 0 ? _a : new Date().toISOString(),
    };
}
exports.buildActiveTaskFromGoaSnapshot = buildActiveTaskFromGoaSnapshot;
function replayActiveTaskFromRuns(input) {
    var _a, _b, _c;
    const runsByTurn = new Map();
    for (const run of input.runs) {
        const bucket = (_a = runsByTurn.get(run.turnId)) !== null && _a !== void 0 ? _a : [];
        bucket.push(run);
        runsByTurn.set(run.turnId, bucket);
    }
    const turnIds = [...runsByTurn.keys()].sort((a, b) => b - a);
    for (const turnId of turnIds) {
        const turnRuns = ((_b = runsByTurn.get(turnId)) !== null && _b !== void 0 ? _b : []).sort((a, b) => b.id - a.id);
        const userInput = (_c = input.turnUserInputById.get(turnId)) !== null && _c !== void 0 ? _c : '';
        const observationLog = [];
        for (const run of turnRuns) {
            observationLog.push(...extractObservationLogFromRunSteps({
                turnId,
                runId: run.id,
                steps: run.steps,
            }));
        }
        for (const run of turnRuns) {
            const snapshot = (0, session_goa_run_snapshot_util_1.parseAgentRunGoaSnapshot)(run.goaSnapshot);
            if (!snapshot) {
                continue;
            }
            const activeTask = buildActiveTaskFromGoaSnapshot({
                turnId,
                runId: run.id,
                runStatus: run.status,
                snapshot,
                observationLog,
            });
            if (activeTask) {
                return activeTask;
            }
        }
        let latestTrace = null;
        let traceRunId = 0;
        let traceRunStatus = 'success';
        for (const run of turnRuns) {
            const trace = extractLatestTaskPlanTraceFromSteps(run.steps, userInput);
            if (trace) {
                latestTrace = trace;
                traceRunId = run.id;
                traceRunStatus = run.status;
                break;
            }
        }
        if (!latestTrace || latestTrace.pendingStepIds.length === 0) {
            continue;
        }
        return buildReplayActiveTask({
            turnId,
            runId: traceRunId,
            userInput,
            runStatus: traceRunStatus,
            trace: latestTrace,
            observationLog,
        });
    }
    return null;
}
exports.replayActiveTaskFromRuns = replayActiveTaskFromRuns;
//# sourceMappingURL=session-goa-replay.util.js.map