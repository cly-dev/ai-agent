"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.advanceHostToolPlanStep = exports.buildHostToolSkippedObservation = exports.buildHostToolDispatchObservations = exports.HOST_TOOL_INVOKE_OBSERVATION_NAME = exports.hostToolCallsMatchPlanStep = exports.partitionDecisionToolCalls = exports.partitionToolCallsByHost = exports.collectRemovedPendingHostToolStepIds = exports.enrichPlanStepsWithHostTools = exports.collectRequiredHostToolNamesForPlanStep = exports.filterHostToolsForPlanStep = void 0;
const task_plan_util_1 = require("../plan/task-plan.util");
const workflow_graph_routing_util_1 = require("../../../../workflow/workflow-graph-routing.util");
const resolve_workflow_node_tool_refs_util_1 = require("../../../../workflow/resolve-workflow-node-tool-refs.util");
function filterHostToolsForPlanStep(hostTools, taskPlan, options) {
    var _a, _b, _c;
    const currentDef = (0, workflow_graph_routing_util_1.getWorkflowNodeDef)(options === null || options === void 0 ? void 0 : options.workflowNodeDefs, (_a = options === null || options === void 0 ? void 0 : options.workflowRun) === null || _a === void 0 ? void 0 : _a.currentNodeId);
    if ((currentDef === null || currentDef === void 0 ? void 0 : currentDef.action) === 'generate_and_push') {
        const nodeIds = (0, resolve_workflow_node_tool_refs_util_1.resolveGenerateAndPushHostToolIds)(currentDef.input);
        if (nodeIds.length > 0) {
            const allowed = new Set(nodeIds);
            return hostTools.filter((tool) => allowed.has(tool.id));
        }
    }
    const step = (0, task_plan_util_1.getPendingPlanHostToolStep)(taskPlan, options === null || options === void 0 ? void 0 : options.workflowRun);
    if (!step) {
        return [];
    }
    const allowed = (_b = step.hostToolNames) === null || _b === void 0 ? void 0 : _b.map((name) => name.trim()).filter(Boolean);
    if (step.hostToolNames != null) {
        if (!(allowed === null || allowed === void 0 ? void 0 : allowed.length)) {
            return [];
        }
        const allowedSet = new Set(allowed);
        return hostTools.filter((tool) => allowedSet.has(tool.name));
    }
    if ((_c = step.hostToolIds) === null || _c === void 0 ? void 0 : _c.length) {
        const allowedIds = new Set(step.hostToolIds);
        return hostTools.filter((tool) => allowedIds.has(tool.id));
    }
    return hostTools;
}
exports.filterHostToolsForPlanStep = filterHostToolsForPlanStep;
function collectRequiredHostToolNamesForPlanStep(pendingHostStep, scopedHostTools) {
    var _a;
    if (!pendingHostStep) {
        return new Set();
    }
    const stepNames = ((_a = pendingHostStep.hostToolNames) === null || _a === void 0 ? void 0 : _a.length)
        ? new Set(pendingHostStep.hostToolNames
            .map((name) => name.trim())
            .filter(Boolean))
        : new Set(scopedHostTools.map((tool) => tool.name));
    const required = new Set();
    for (const tool of scopedHostTools) {
        if (tool.isRequired && stepNames.has(tool.name)) {
            required.add(tool.name);
        }
    }
    return required;
}
exports.collectRequiredHostToolNamesForPlanStep = collectRequiredHostToolNamesForPlanStep;
function enrichHostToolStep(step, scopedHostTools, scopedNames) {
    var _a, _b;
    if (step.kind !== 'host_tool') {
        return step;
    }
    if ((_a = step.hostToolNames) === null || _a === void 0 ? void 0 : _a.length) {
        const names = step.hostToolNames.filter((name) => scopedNames.has(name));
        return Object.assign(Object.assign({}, step), { hostToolNames: names });
    }
    if ((_b = step.hostToolIds) === null || _b === void 0 ? void 0 : _b.length) {
        const allowedIds = new Set(step.hostToolIds);
        const names = scopedHostTools
            .filter((tool) => allowedIds.has(tool.id))
            .map((tool) => tool.name);
        return Object.assign(Object.assign({}, step), { hostToolNames: names });
    }
    return Object.assign(Object.assign({}, step), { hostToolNames: scopedHostTools.map((tool) => tool.name) });
}
function isInvalidEnrichedHostToolStep(step) {
    return (step.kind === 'host_tool' &&
        step.hostToolNames != null &&
        step.hostToolNames.length === 0);
}
function mapPlanWithEnrichedHostToolSteps(plan, scopedHostTools, scopedNames) {
    const mapSteps = (steps) => steps.map((step) => enrichHostToolStep(step, scopedHostTools, scopedNames));
    return Object.assign(Object.assign({}, plan), { steps: mapSteps(plan.steps), frames: plan.frames.map((frame) => (Object.assign(Object.assign({}, frame), { steps: mapSteps(frame.steps) }))) });
}
function enrichPlanStepsWithHostTools(plan, scopedHostTools) {
    if (scopedHostTools.length === 0) {
        return { plan, prunedHostToolStepIds: [] };
    }
    const scopedNames = new Set(scopedHostTools.map((tool) => tool.name));
    let current = mapPlanWithEnrichedHostToolSteps(plan, scopedHostTools, scopedNames);
    const prunedHostToolStepIds = [];
    while (true) {
        const pendingHost = (0, task_plan_util_1.getPendingPlanHostToolStep)(current);
        if (!pendingHost || !isInvalidEnrichedHostToolStep(pendingHost)) {
            break;
        }
        prunedHostToolStepIds.push(pendingHost.id);
        current = (0, task_plan_util_1.advancePlanAfterStepComplete)(current, pendingHost.id).updatedPlan;
    }
    return { plan: current, prunedHostToolStepIds };
}
exports.enrichPlanStepsWithHostTools = enrichPlanStepsWithHostTools;
function collectRemovedPendingHostToolStepIds(before, after) {
    if (!before || !after) {
        return [];
    }
    const beforePendingHost = before.pendingStepIds.filter((stepId) => {
        const step = before.steps.find((row) => row.id === stepId);
        return (step === null || step === void 0 ? void 0 : step.kind) === 'host_tool';
    });
    const afterPendingHost = new Set(after.pendingStepIds.filter((stepId) => {
        const step = after.steps.find((row) => row.id === stepId);
        return (step === null || step === void 0 ? void 0 : step.kind) === 'host_tool';
    }));
    return beforePendingHost.filter((stepId) => !afterPendingHost.has(stepId));
}
exports.collectRemovedPendingHostToolStepIds = collectRemovedPendingHostToolStepIds;
function partitionToolCallsByHost(toolCalls, hostToolNames) {
    const httpCalls = [];
    const hostCalls = [];
    for (const call of toolCalls) {
        if (hostToolNames.has(call.name)) {
            hostCalls.push(call);
        }
        else {
            httpCalls.push(call);
        }
    }
    return { httpCalls, hostCalls };
}
exports.partitionToolCallsByHost = partitionToolCallsByHost;
function partitionDecisionToolCalls(toolCalls, pendingHostStep, allowedHostToolNames) {
    const hostNameSet = pendingHostStep ? allowedHostToolNames : new Set();
    return partitionToolCallsByHost(toolCalls, hostNameSet);
}
exports.partitionDecisionToolCalls = partitionDecisionToolCalls;
function hostToolCallsMatchPlanStep(step, hostCalls) {
    var _a;
    if (hostCalls.length === 0) {
        return false;
    }
    const allowed = (_a = step.hostToolNames) === null || _a === void 0 ? void 0 : _a.map((name) => name.trim()).filter(Boolean);
    if (step.hostToolNames != null) {
        if (!(allowed === null || allowed === void 0 ? void 0 : allowed.length)) {
            return false;
        }
        const allowedSet = new Set(allowed);
        return hostCalls.every((call) => allowedSet.has(call.name));
    }
    return true;
}
exports.hostToolCallsMatchPlanStep = hostToolCallsMatchPlanStep;
exports.HOST_TOOL_INVOKE_OBSERVATION_NAME = 'host_tool_invoke';
function buildHostToolDispatchObservations(input) {
    return input.hostCalls.map((call) => ({
        name: exports.HOST_TOOL_INVOKE_OBSERVATION_NAME,
        output: {
            outcome: 'dispatched',
            tool: call.name,
            arguments: call.arguments,
            planStepId: input.planStepId,
        },
    }));
}
exports.buildHostToolDispatchObservations = buildHostToolDispatchObservations;
function buildHostToolSkippedObservation(input) {
    var _a, _b;
    return {
        name: exports.HOST_TOOL_INVOKE_OBSERVATION_NAME,
        output: Object.assign(Object.assign({ outcome: 'skipped', planStepId: input.planStepId, reason: input.reason }, (((_a = input.hostCalls) === null || _a === void 0 ? void 0 : _a.length)
            ? { attemptedTools: input.hostCalls.map((call) => call.name) }
            : {})), (((_b = input.httpCalls) === null || _b === void 0 ? void 0 : _b.length)
            ? { attemptedHttpTools: input.httpCalls.map((call) => call.name) }
            : {})),
    };
}
exports.buildHostToolSkippedObservation = buildHostToolSkippedObservation;
function advanceHostToolPlanStep(plan, input) {
    var _a;
    const step = (0, task_plan_util_1.getPendingPlanHostToolStep)(plan);
    if (!step || step.id !== input.planStepId) {
        return null;
    }
    if (input.requireMatch) {
        if (!((_a = input.hostCalls) === null || _a === void 0 ? void 0 : _a.length) ||
            !hostToolCallsMatchPlanStep(step, input.hostCalls)) {
            return null;
        }
    }
    return (0, task_plan_util_1.advancePlanAfterStepComplete)(plan, input.planStepId);
}
exports.advanceHostToolPlanStep = advanceHostToolPlanStep;
//# sourceMappingURL=host-tool-plan.util.js.map