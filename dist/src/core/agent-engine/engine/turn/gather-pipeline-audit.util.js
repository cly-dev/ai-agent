"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pendingClarificationFromRespond = exports.buildGatherPipelineAudit = void 0;
const turn_respond_util_1 = require("./turn-respond.util");
function readStepOutput(step) {
    if (!(step === null || step === void 0 ? void 0 : step.output) || typeof step.output !== 'object' || Array.isArray(step.output)) {
        return {};
    }
    return step.output;
}
function findLastStep(steps, type) {
    var _a;
    for (let index = steps.length - 1; index >= 0; index -= 1) {
        if (((_a = steps[index]) === null || _a === void 0 ? void 0 : _a.type) === type) {
            return steps[index];
        }
    }
    return undefined;
}
function readStringArray(raw) {
    if (!Array.isArray(raw)) {
        return [];
    }
    return raw.filter((item) => typeof item === 'string');
}
function buildGatherPipelineAudit(input) {
    var _a;
    const toolResolveStep = findLastStep(input.steps, 'tool_resolve');
    const llmStep = findLastStep(input.steps, 'llm');
    const paramGateStep = findLastStep(input.steps, 'param_gate');
    const toolsStepCount = input.steps.filter((step) => step.type === 'tool').length;
    const toolResolveOut = readStepOutput(toolResolveStep);
    const llmOut = readStepOutput(llmStep);
    const paramGateOut = readStepOutput(paramGateStep);
    const toolCalls = llmOut.toolCalls;
    const toolCallRows = Array.isArray(toolCalls) ? toolCalls : [];
    const toolNames = toolCallRows
        .map((row) => {
        if (!row || typeof row !== 'object' || Array.isArray(row)) {
            return null;
        }
        const name = row.name;
        return typeof name === 'string' ? name : null;
    })
        .filter((name) => name != null);
    const prematureClarification = input.pendingClarification === true;
    const invariantViolations = [];
    if (prematureClarification && toolsStepCount === 0) {
        invariantViolations.push('clarification_without_tools_execution');
    }
    if (toolCallRows.length === 0 &&
        prematureClarification &&
        paramGateOut.status !== 'clarify') {
        invariantViolations.push('clarification_without_tool_calls_or_param_gate');
    }
    return {
        planStepId: (_a = input.planStepId) !== null && _a !== void 0 ? _a : null,
        toolResolve: toolResolveStep
            ? {
                strategy: typeof toolResolveOut.strategy === 'string'
                    ? toolResolveOut.strategy
                    : null,
                candidateCount: typeof toolResolveOut.candidateCount === 'number'
                    ? toolResolveOut.candidateCount
                    : 0,
                candidateNames: readStringArray(toolResolveOut.candidateNames),
            }
            : null,
        llm: llmStep
            ? {
                toolCallCount: toolCallRows.length,
                toolNames,
            }
            : null,
        paramGate: paramGateStep
            ? {
                status: typeof paramGateOut.status === 'string' ? paramGateOut.status : 'unknown',
                missingFieldCount: typeof paramGateOut.missingFieldCount === 'number'
                    ? paramGateOut.missingFieldCount
                    : 0,
            }
            : null,
        toolsStepCount,
        prematureClarification,
        invariantViolations,
    };
}
exports.buildGatherPipelineAudit = buildGatherPipelineAudit;
function pendingClarificationFromRespond(pending) {
    if (!pending || typeof pending !== 'object') {
        return false;
    }
    const row = pending;
    if (row.mode === 'turn') {
        const request = row.request;
        if (request && typeof request === 'object' && !Array.isArray(request)) {
            return request.kind === 'clarification';
        }
    }
    if (row.mode === 'observation') {
        const observation = row.observation;
        if (observation &&
            typeof observation === 'object' &&
            !Array.isArray(observation)) {
            return (observation.name ===
                turn_respond_util_1.CLARIFICATION_REQUEST_OBSERVATION_NAME);
        }
    }
    return false;
}
exports.pendingClarificationFromRespond = pendingClarificationFromRespond;
//# sourceMappingURL=gather-pipeline-audit.util.js.map