"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatHostToolFillContextForTerminalSummarize = exports.buildPlanContextForSummarize = exports.resolveReasonDraftForHostToolStep = exports.extractHostToolDispatchedFillText = exports.findPrecedingReasonStepId = void 0;
const plan_draft_reply_util_1 = require("../plan-present/plan-draft-reply.util");
const plan_host_fill_util_1 = require("../plan-present/plan-host-fill.util");
const task_plan_util_1 = require("../plan/task-plan.util");
const host_tool_plan_util_1 = require("./host-tool-plan.util");
const HOST_TOOL_TEXT_ARG_KEYS = ['text', 'content', 'value', 'draft', 'body'];
function findPrecedingReasonStepId(plan, beforeStepId) {
    const idx = plan.steps.findIndex((step) => step.id === beforeStepId);
    if (idx <= 0) {
        return null;
    }
    for (let i = idx - 1; i >= 0; i -= 1) {
        const step = plan.steps[i];
        if (step.kind === 'reason') {
            return step.id;
        }
    }
    return null;
}
exports.findPrecedingReasonStepId = findPrecedingReasonStepId;
function extractTextFromHostToolArguments(args) {
    if (!args) {
        return null;
    }
    for (const key of HOST_TOOL_TEXT_ARG_KEYS) {
        const value = args[key];
        if (typeof value === 'string' && value.trim().length > 0) {
            return value.trim();
        }
    }
    return null;
}
function extractHostToolDispatchedFillText(input) {
    for (let i = input.observations.length - 1; i >= 0; i -= 1) {
        const row = input.observations[i];
        if ((row === null || row === void 0 ? void 0 : row.name) !== host_tool_plan_util_1.HOST_TOOL_INVOKE_OBSERVATION_NAME) {
            continue;
        }
        const output = row.output;
        if ((output === null || output === void 0 ? void 0 : output.outcome) !== 'dispatched') {
            continue;
        }
        if (input.planStepId &&
            output.planStepId &&
            output.planStepId !== input.planStepId) {
            continue;
        }
        const args = output.arguments;
        const text = extractTextFromHostToolArguments(args);
        if (text) {
            return text;
        }
    }
    return null;
}
exports.extractHostToolDispatchedFillText = extractHostToolDispatchedFillText;
function resolveReasonDraftForHostToolStep(input) {
    var _a;
    const hostStep = (0, task_plan_util_1.getPendingPlanHostToolStep)(input.taskPlan);
    if (!hostStep) {
        return null;
    }
    const reasonStepId = findPrecedingReasonStepId(input.taskPlan, hostStep.id);
    const machineLayer = (0, plan_host_fill_util_1.resolveLatestPlanHostFill)(input.observations, reasonStepId !== null && reasonStepId !== void 0 ? reasonStepId : undefined);
    if (machineLayer) {
        const text = (0, plan_host_fill_util_1.extractPrimaryFillTextFromHostFills)(machineLayer.fills);
        return text.length > 0 ? text : null;
    }
    for (let i = input.observations.length - 1; i >= 0; i -= 1) {
        const row = input.observations[i];
        if ((row === null || row === void 0 ? void 0 : row.name) !== plan_draft_reply_util_1.PLAN_DRAFT_REPLY_OBSERVATION_NAME) {
            continue;
        }
        const output = row.output;
        if (reasonStepId && output.planStepId && output.planStepId !== reasonStepId) {
            continue;
        }
        const submitText = (_a = output.submitText) === null || _a === void 0 ? void 0 : _a.trim();
        if (submitText) {
            return submitText;
        }
    }
    return null;
}
exports.resolveReasonDraftForHostToolStep = resolveReasonDraftForHostToolStep;
function buildPlanContextForSummarize(plan, observations) {
    const base = (0, task_plan_util_1.formatPlanContextForSummarize)(plan);
    const hostFill = plan && (observations === null || observations === void 0 ? void 0 : observations.length)
        ? formatHostToolFillContextForTerminalSummarize(plan, observations)
        : null;
    if (!base && !hostFill) {
        return null;
    }
    return [base, hostFill].filter(Boolean).join('\n\n');
}
exports.buildPlanContextForSummarize = buildPlanContextForSummarize;
function formatHostToolFillContextForTerminalSummarize(plan, observations) {
    var _a;
    const pending = (0, task_plan_util_1.getPendingPlanStep)(plan);
    if (!pending || pending.kind !== 'summarize') {
        return null;
    }
    const completed = (_a = plan === null || plan === void 0 ? void 0 : plan.completedStepIds) !== null && _a !== void 0 ? _a : [];
    const lastCompletedId = completed[completed.length - 1];
    if (!lastCompletedId) {
        return null;
    }
    const lastCompleted = plan === null || plan === void 0 ? void 0 : plan.steps.find((step) => step.id === lastCompletedId);
    if ((lastCompleted === null || lastCompleted === void 0 ? void 0 : lastCompleted.kind) !== 'host_tool') {
        return null;
    }
    const fillText = extractHostToolDispatchedFillText({
        observations,
        planStepId: lastCompletedId,
    });
    if (!fillText) {
        return null;
    }
    return [
        'Host tool fill (already pushed to page UI):',
        fillText,
        'Terminal summary must stay consistent with the pushed body. You may add brief framing but must not contradict or replace the pushed text.',
    ].join('\n');
}
exports.formatHostToolFillContextForTerminalSummarize = formatHostToolFillContextForTerminalSummarize;
//# sourceMappingURL=host-tool-fill-alignment.util.js.map