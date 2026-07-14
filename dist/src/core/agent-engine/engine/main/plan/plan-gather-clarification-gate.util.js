"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPrematureGatherClarification = exports.isGatherPendingWithoutToolExecution = exports.isParamGateSourcedClarification = void 0;
const plan_summarize_gate_util_1 = require("./plan-summarize-gate.util");
const task_plan_util_1 = require("./task-plan.util");
const turn_respond_util_1 = require("../../turn/turn-respond.util");
const PARAM_GATE_CLARIFICATION_PREFIX = 'param_gate:';
function isParamGateSourcedClarification(input) {
    return (typeof input.readinessReason === 'string' &&
        input.readinessReason.startsWith(PARAM_GATE_CLARIFICATION_PREFIX));
}
exports.isParamGateSourcedClarification = isParamGateSourcedClarification;
function readinessReasonFromPending(pending) {
    var _a;
    if (pending.mode === 'turn' && pending.request.kind === 'clarification') {
        return (_a = pending.request.payload) === null || _a === void 0 ? void 0 : _a.readinessReason;
    }
    if (pending.mode === 'observation' &&
        pending.observation.name === turn_respond_util_1.CLARIFICATION_REQUEST_OBSERVATION_NAME) {
        const output = pending.observation.output;
        if (output && typeof output === 'object' && !Array.isArray(output)) {
            const reason = output.readinessReason;
            return typeof reason === 'string' ? reason : undefined;
        }
    }
    return undefined;
}
function isGatherPendingWithoutToolExecution(input) {
    if (!(0, plan_summarize_gate_util_1.planSummarizeRequiresToolEvidence)(input.taskPlan)) {
        return false;
    }
    const runToolObs = input.observationBuckets.runOwned.filter((row) => row.name !== turn_respond_util_1.CLARIFICATION_REQUEST_OBSERVATION_NAME);
    if (runToolObs.length > 0) {
        return false;
    }
    const pendingGather = (0, task_plan_util_1.getPendingPlanToolStep)(input.taskPlan, input.workflowRun);
    if ((pendingGather === null || pendingGather === void 0 ? void 0 : pendingGather.kind) === 'tool' && pendingGather.phase === 'gather') {
        return true;
    }
    if (input.taskPlan &&
        (0, task_plan_util_1.isPendingPlanAnswerStep)(input.taskPlan, input.workflowRun) &&
        (0, plan_summarize_gate_util_1.planSummarizeRequiresToolEvidence)(input.taskPlan)) {
        return true;
    }
    return false;
}
exports.isGatherPendingWithoutToolExecution = isGatherPendingWithoutToolExecution;
function isPrematureGatherClarification(input) {
    if (!input.pendingRespond) {
        return false;
    }
    const observation = (0, turn_respond_util_1.resolveObservationForSummarize)(input.pendingRespond);
    if (!observation || observation.name !== turn_respond_util_1.CLARIFICATION_REQUEST_OBSERVATION_NAME) {
        return false;
    }
    if (isParamGateSourcedClarification({
        readinessReason: readinessReasonFromPending(input.pendingRespond),
    })) {
        return false;
    }
    return isGatherPendingWithoutToolExecution(input);
}
exports.isPrematureGatherClarification = isPrematureGatherClarification;
//# sourceMappingURL=plan-gather-clarification-gate.util.js.map