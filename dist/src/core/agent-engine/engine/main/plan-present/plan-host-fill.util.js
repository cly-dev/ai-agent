"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeHostToolsForReasonFillPrompt = exports.hasPlanHostFillForDispatch = exports.resolvePlanHostFillCalls = exports.resolveHostToolsForUpcomingHostStep = exports.isPlanReasonBeforeHostTool = exports.extractPrimaryFillTextFromHostFills = exports.resolveLatestPlanHostFill = exports.buildPlanHostFillObservation = exports.PLAN_HOST_FILL_OBSERVATION_NAME = void 0;
const host_tool_string_arg_util_1 = require("../../../../host-bridge/host-tool-string-arg.util");
const host_tool_langchain_util_1 = require("../../../../host-bridge/host-tool-langchain.util");
const host_tool_fill_alignment_util_1 = require("../host-tool/host-tool-fill-alignment.util");
const task_plan_util_1 = require("../plan/task-plan.util");
const write_tool_draft_injection_util_1 = require("../../../../tool-engine/write-tool-draft-injection.util");
exports.PLAN_HOST_FILL_OBSERVATION_NAME = 'plan_host_fill';
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function buildPlanHostFillObservation(input) {
    var _a;
    const fills = input.fills
        .map((row) => ({
        tool: row.tool.trim(),
        arguments: row.arguments,
    }))
        .filter((row) => row.tool.length > 0);
    return {
        name: exports.PLAN_HOST_FILL_OBSERVATION_NAME,
        output: {
            planStepId: (_a = input.planStepId) !== null && _a !== void 0 ? _a : null,
            fills,
            source: 'plan_reason_host_fill',
        },
        quality: 'high',
    };
}
exports.buildPlanHostFillObservation = buildPlanHostFillObservation;
function resolveLatestPlanHostFill(observations, planStepId) {
    var _a;
    for (let i = observations.length - 1; i >= 0; i -= 1) {
        const row = observations[i];
        if ((row === null || row === void 0 ? void 0 : row.name) !== exports.PLAN_HOST_FILL_OBSERVATION_NAME) {
            continue;
        }
        const output = row.output;
        if (planStepId && (output === null || output === void 0 ? void 0 : output.planStepId) && output.planStepId !== planStepId) {
            continue;
        }
        if (!Array.isArray(output === null || output === void 0 ? void 0 : output.fills) || output.fills.length === 0) {
            continue;
        }
        const fills = output.fills
            .map((entry) => {
            if (!entry || typeof entry.tool !== 'string') {
                return null;
            }
            const tool = entry.tool.trim();
            if (!tool || !isRecord(entry.arguments)) {
                return null;
            }
            return { tool, arguments: entry.arguments };
        })
            .filter((entry) => entry != null);
        if (fills.length === 0) {
            continue;
        }
        return {
            planStepId: (_a = output.planStepId) !== null && _a !== void 0 ? _a : null,
            fills,
            source: 'plan_reason_host_fill',
        };
    }
    return null;
}
exports.resolveLatestPlanHostFill = resolveLatestPlanHostFill;
function extractPrimaryFillTextFromHostFills(fills) {
    for (const fill of fills) {
        for (const key of host_tool_string_arg_util_1.HOST_TOOL_STRING_ARG_KEYS) {
            const value = fill.arguments[key];
            if (typeof value === 'string' && (0, write_tool_draft_injection_util_1.isUsablePlanDraftSubmitText)(value)) {
                return value.trim();
            }
        }
    }
    return '';
}
exports.extractPrimaryFillTextFromHostFills = extractPrimaryFillTextFromHostFills;
function isPlanReasonBeforeHostTool(plan) {
    if (!plan) {
        return false;
    }
    const pending = (0, task_plan_util_1.getPendingPlanStep)(plan);
    if (!pending || pending.kind !== 'reason') {
        return false;
    }
    const afterFinalize = (0, task_plan_util_1.finalizePlanAfterSummarize)(plan);
    if (!afterFinalize) {
        return false;
    }
    return (0, task_plan_util_1.getPendingPlanHostToolStep)(afterFinalize) != null;
}
exports.isPlanReasonBeforeHostTool = isPlanReasonBeforeHostTool;
function resolveHostToolsForUpcomingHostStep(plan, scopedHostTools) {
    var _a;
    const afterFinalize = (0, task_plan_util_1.finalizePlanAfterSummarize)(plan);
    if (!afterFinalize) {
        return [];
    }
    const hostStep = (0, task_plan_util_1.getPendingPlanHostToolStep)(afterFinalize);
    if (!hostStep) {
        return [];
    }
    const allowed = (_a = hostStep.hostToolNames) === null || _a === void 0 ? void 0 : _a.map((name) => name.trim()).filter(Boolean);
    if (hostStep.hostToolNames != null) {
        if (!(allowed === null || allowed === void 0 ? void 0 : allowed.length)) {
            return [];
        }
        const allowedSet = new Set(allowed);
        return scopedHostTools.filter((tool) => allowedSet.has(tool.name));
    }
    return scopedHostTools;
}
exports.resolveHostToolsForUpcomingHostStep = resolveHostToolsForUpcomingHostStep;
function normalizeHostFillEntry(entry, allowedTools) {
    const def = allowedTools.get(entry.tool);
    if (!def) {
        return null;
    }
    const args = Object.assign({}, entry.arguments);
    for (const key of Object.keys(args)) {
        const value = args[key];
        if (typeof value === 'string') {
            args[key] = value.trim();
        }
    }
    const hasPayload = host_tool_string_arg_util_1.HOST_TOOL_STRING_ARG_KEYS.some((key) => {
        const value = args[key];
        return typeof value === 'string' && value.trim().length > 0;
    });
    if (!hasPayload && Object.keys(args).length === 0) {
        return null;
    }
    return { tool: entry.tool, arguments: args };
}
function resolvePlanHostFillCalls(input) {
    var _a;
    const reasonStepId = (0, host_tool_fill_alignment_util_1.findPrecedingReasonStepId)(input.taskPlan, input.pendingHostStep.id);
    const machineLayer = resolveLatestPlanHostFill(input.observations, reasonStepId !== null && reasonStepId !== void 0 ? reasonStepId : undefined);
    if (!machineLayer) {
        return [];
    }
    const allowedTools = new Map(input.hostToolsForPrompt.map((tool) => [tool.name, tool]));
    const stepNames = ((_a = input.pendingHostStep.hostToolNames) === null || _a === void 0 ? void 0 : _a.length)
        ? new Set(input.pendingHostStep.hostToolNames
            .map((name) => name.trim())
            .filter(Boolean))
        : null;
    const calls = [];
    for (const entry of machineLayer.fills) {
        if (stepNames && !stepNames.has(entry.tool)) {
            continue;
        }
        const normalized = normalizeHostFillEntry(entry, allowedTools);
        if (!normalized) {
            continue;
        }
        calls.push({
            name: normalized.tool,
            arguments: normalized.arguments,
        });
    }
    return calls;
}
exports.resolvePlanHostFillCalls = resolvePlanHostFillCalls;
function hasPlanHostFillForDispatch(input) {
    return (resolvePlanHostFillCalls(input).length > 0 &&
        input.hostToolsForPrompt.length > 0);
}
exports.hasPlanHostFillForDispatch = hasPlanHostFillForDispatch;
function summarizeHostToolsForReasonFillPrompt(tools) {
    return JSON.stringify((0, host_tool_langchain_util_1.summarizeHostToolsForLlmSchema)(tools), null, 2);
}
exports.summarizeHostToolsForReasonFillPrompt = summarizeHostToolsForReasonFillPrompt;
//# sourceMappingURL=plan-host-fill.util.js.map