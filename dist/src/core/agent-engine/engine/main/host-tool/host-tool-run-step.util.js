"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCompletionHostToolRunStep = exports.buildHostToolRequiredMissedStep = exports.buildHostToolRunStepFromPlanHandle = exports.buildHostToolRunStep = exports.resolveHostToolPlanRunStatus = void 0;
const agent_run_steps_util_1 = require("../run/agent-run-steps.util");
function resolveHostToolPlanRunStatus(input) {
    const plannedHostToolStepIds = input.taskPlan.steps
        .filter((step) => step.kind === 'host_tool')
        .map((step) => step.id);
    if (input.availableHostToolCount === 0) {
        return { plannedHostToolStepIds, hostToolRunStatus: 'none' };
    }
    if (plannedHostToolStepIds.length === 0) {
        return {
            plannedHostToolStepIds,
            hostToolRunStatus: 'available_not_planned',
        };
    }
    return { plannedHostToolStepIds, hostToolRunStatus: 'planned' };
}
exports.resolveHostToolPlanRunStatus = resolveHostToolPlanRunStatus;
function mapHostToolInvocations(calls) {
    return calls.map((call) => {
        var _a;
        return ({
            name: call.name,
            args: 'arguments' in call
                ? call.arguments
                : ((_a = call.args) !== null && _a !== void 0 ? _a : {}),
        });
    });
}
function buildHostToolRunStep(input) {
    var _a, _b, _c, _d, _e, _f, _g;
    return {
        step: (0, agent_run_steps_util_1.nextRunStepNumber)(input.existingSteps),
        type: 'host_tool',
        name: input.planStepId ? `plan:${input.planStepId}` : input.reason,
        output: {
            status: input.status,
            reason: input.reason,
            planStepId: (_a = input.planStepId) !== null && _a !== void 0 ? _a : null,
            pageScope: (_b = input.pageScope) !== null && _b !== void 0 ? _b : null,
            hostTools: (_c = input.hostTools) !== null && _c !== void 0 ? _c : [],
            skipReason: (_d = input.skipReason) !== null && _d !== void 0 ? _d : null,
            sseDispatched: (_e = input.sseDispatched) !== null && _e !== void 0 ? _e : false,
            hostToolCount: (_g = (_f = input.hostTools) === null || _f === void 0 ? void 0 : _f.length) !== null && _g !== void 0 ? _g : 0,
        },
    };
}
exports.buildHostToolRunStep = buildHostToolRunStep;
function buildHostToolRunStepFromPlanHandle(input) {
    var _a, _b, _c, _d;
    const dispatched = Boolean(input.handle.ssePayload);
    const hostTools = (_c = (_b = (_a = input.handle.ssePayload) === null || _a === void 0 ? void 0 : _a.hostTools) === null || _b === void 0 ? void 0 : _b.map((tool) => {
        var _a;
        return ({
            name: tool.name,
            args: (_a = tool.args) !== null && _a !== void 0 ? _a : {},
        });
    })) !== null && _c !== void 0 ? _c : input.handle.observations
        .filter((row) => { var _a; return ((_a = row.output) === null || _a === void 0 ? void 0 : _a.outcome) === 'dispatched'; })
        .map((row) => {
        var _a, _b;
        return ({
            name: String((_a = row.output.tool) !== null && _a !== void 0 ? _a : ''),
            args: (_b = row.output.arguments) !== null && _b !== void 0 ? _b : {},
        });
    })
        .filter((row) => row.name);
    return buildHostToolRunStep({
        existingSteps: input.existingSteps,
        status: dispatched ? 'dispatched' : 'skipped',
        reason: 'plan_host_tool',
        planStepId: input.planStepId,
        pageScope: input.pageScope,
        hostTools,
        skipReason: (_d = input.handle.skipReason) !== null && _d !== void 0 ? _d : null,
        sseDispatched: dispatched,
    });
}
exports.buildHostToolRunStepFromPlanHandle = buildHostToolRunStepFromPlanHandle;
function buildHostToolRequiredMissedStep(input) {
    var _a;
    return buildHostToolRunStep({
        existingSteps: input.existingSteps,
        status: 'required_missed',
        reason: 'plan_host_tool',
        planStepId: input.planStepId,
        pageScope: input.pageScope,
        hostTools: ((_a = input.hostCalls) === null || _a === void 0 ? void 0 : _a.length)
            ? mapHostToolInvocations(input.hostCalls)
            : undefined,
        skipReason: input.skipReason,
        sseDispatched: false,
    });
}
exports.buildHostToolRequiredMissedStep = buildHostToolRequiredMissedStep;
function buildCompletionHostToolRunStep(input) {
    return buildHostToolRunStep({
        existingSteps: input.existingSteps,
        status: input.sseDispatched ? 'completion_dispatched' : 'completion_skipped',
        reason: 'agent_mutation_success',
        pageScope: input.pageScope,
        hostTools: mapHostToolInvocations(input.hostTools),
        sseDispatched: input.sseDispatched,
    });
}
exports.buildCompletionHostToolRunStep = buildCompletionHostToolRunStep;
//# sourceMappingURL=host-tool-run-step.util.js.map