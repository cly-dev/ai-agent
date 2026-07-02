"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAgentRunSteps = exports.mergeTurnExecutionSteps = exports.offsetRunSteps = exports.nextRunStepNumber = exports.maxRunStepNumber = void 0;
function maxRunStepNumber(steps) {
    return steps.reduce((max, row) => Math.max(max, typeof row.step === 'number' ? row.step : 0), 0);
}
exports.maxRunStepNumber = maxRunStepNumber;
function nextRunStepNumber(steps) {
    return maxRunStepNumber(steps) + 1;
}
exports.nextRunStepNumber = nextRunStepNumber;
function offsetRunSteps(steps, startStep) {
    return steps.map((step, index) => (Object.assign(Object.assign({}, step), { step: startStep + index })));
}
exports.offsetRunSteps = offsetRunSteps;
function mergeTurnExecutionSteps(runs) {
    const ordered = [...runs].sort((a, b) => a.sequence - b.sequence || a.runId - b.runId);
    const merged = [];
    let turnStep = 0;
    for (const run of ordered) {
        const steps = Array.isArray(run.steps) ? run.steps : [];
        const sorted = [...steps].sort((a, b) => (typeof a.step === 'number' ? a.step : 0) - (typeof b.step === 'number' ? b.step : 0));
        for (const step of sorted) {
            turnStep += 1;
            merged.push(Object.assign(Object.assign({}, step), { turnStep, sourceRunId: run.runId, sourceRunRole: run.role }));
        }
    }
    return merged;
}
exports.mergeTurnExecutionSteps = mergeTurnExecutionSteps;
function parseAgentRunSteps(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.filter((row) => row != null && typeof row === 'object' && !Array.isArray(row));
}
exports.parseAgentRunSteps = parseAgentRunSteps;
//# sourceMappingURL=agent-run-steps.util.js.map