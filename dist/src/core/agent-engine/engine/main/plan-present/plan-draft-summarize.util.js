"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPlanPresentUserLayer = exports.finalizePlanPendingWriteToolCallFromComposedArgs = exports.finalizePlanPendingWriteToolCall = exports.buildWriteConfirmationDetailMarkdown = exports.resolvePlanDraftReplyContentForGateObservation = exports.syncPlanPresentSubmitTextForGate = exports.resolvePendingWriteFromComposedObservation = exports.finalizeDraftReplyPendingWriteCall = exports.resolvePendingWriteForPlanWriteStep = exports.resolvePendingWriteForPlanWriteStepResult = exports.resolveComposedWriteGateCall = exports.resolveComposedWriteGateCallResult = exports.finalizeComposedWritePendingCall = exports.finalizeComposedWritePendingCallResult = exports.buildFallbackUserDraftFromSubmitText = exports.resolveSubmitTextForWriteTool = exports.isUsablePlanMutationPreviewDraft = exports.isUsablePlanDraftUserFacingDraft = exports.isPlanDraftToolObservationDump = exports.isPlanDraftSummarizeBeforeWrite = exports.formatComposedWriteGateDiagnosticForLog = exports.summarizeWriteArgsForGateLog = void 0;
const write_tool_draft_injection_util_1 = require("../../../../tool-engine/write-tool-draft-injection.util");
const plan_present_display_util_1 = require("./plan-present-display.util");
const plan_compose_write_util_1 = require("./plan-compose-write.util");
const write_tool_draft_injection_util_2 = require("../../../../tool-engine/write-tool-draft-injection.util");
const plan_draft_reply_util_1 = require("./plan-draft-reply.util");
const task_plan_util_1 = require("../plan/task-plan.util");
const MIN_PLAN_DRAFT_SUBSTANTIVE_CHARS = 12;
const COMPOSE_GATE_LOG_ARGS_MAX_CHARS = 600;
const COMPOSE_GATE_LOG_SUBMIT_PREVIEW_MAX_CHARS = 120;
function summarizeRecordForComposeGateLog(value) {
    try {
        const raw = JSON.stringify(value);
        if (raw.length <= COMPOSE_GATE_LOG_ARGS_MAX_CHARS) {
            return raw;
        }
        return `${raw.slice(0, COMPOSE_GATE_LOG_ARGS_MAX_CHARS)}…(${raw.length} chars)`;
    }
    catch (_a) {
        return '[unserializable]';
    }
}
function summarizeWriteArgsForGateLog(value) {
    return summarizeRecordForComposeGateLog(value);
}
exports.summarizeWriteArgsForGateLog = summarizeWriteArgsForGateLog;
function previewSubmitTextForComposeGateLog(text) {
    if (!text) {
        return null;
    }
    const trimmed = text.trim();
    if (!trimmed) {
        return null;
    }
    if (trimmed.length <= COMPOSE_GATE_LOG_SUBMIT_PREVIEW_MAX_CHARS) {
        return trimmed;
    }
    return `${trimmed.slice(0, COMPOSE_GATE_LOG_SUBMIT_PREVIEW_MAX_CHARS)}…(${trimmed.length} chars)`;
}
function emptyComposedWriteGateDiagnostic(input) {
    return Object.assign({ composedTool: '', composedPlanStepId: null, taskPlanCurrentStepId: null, composedArgsSummary: '{}', normalizedArgsSummary: '{}', submitTextPreview: null, submitTextUsable: false, pageContextEntityId: null, writeToolResolved: false }, input);
}
function formatComposedWriteGateDiagnosticForLog(result) {
    var _a, _b, _c, _d, _e;
    const diagnostic = result.diagnostic;
    return [
        `failureReason=${(_a = result.failureReason) !== null && _a !== void 0 ? _a : 'ok'}`,
        `tool=${diagnostic.composedTool || 'unknown'}`,
        `planStep=${(_b = diagnostic.composedPlanStepId) !== null && _b !== void 0 ? _b : 'null'}`,
        `taskPlanStep=${(_c = diagnostic.taskPlanCurrentStepId) !== null && _c !== void 0 ? _c : 'null'}`,
        `writeToolResolved=${diagnostic.writeToolResolved}`,
        `submitUsable=${diagnostic.submitTextUsable}`,
        `submitPreview=${(_d = diagnostic.submitTextPreview) !== null && _d !== void 0 ? _d : 'null'}`,
        `pageContextEntityId=${(_e = diagnostic.pageContextEntityId) !== null && _e !== void 0 ? _e : 'null'}`,
        `composedArgs=${diagnostic.composedArgsSummary}`,
        `normalizedArgs=${diagnostic.normalizedArgsSummary}`,
        `gateCall=${result.call ? 'yes' : 'no'}`,
    ].join(' ');
}
exports.formatComposedWriteGateDiagnosticForLog = formatComposedWriteGateDiagnosticForLog;
function resolveWriteToolDef(toolName, scopedTools, taskPlan, workflowRun, workflowNodeDefs) {
    const allowedTools = (0, task_plan_util_1.filterScopedToolsForPlanStep)(scopedTools, taskPlan, workflowRun, workflowNodeDefs);
    return allowedTools.find((tool) => tool.name === toolName);
}
function isMutationStepAfterPresentSummarize(afterFinalize) {
    const nextStep = (0, task_plan_util_1.getPendingPlanStep)(afterFinalize);
    if (!nextStep) {
        return false;
    }
    if ((0, task_plan_util_1.isPlanWorkflowGateStep)(nextStep)) {
        return true;
    }
    if ((0, task_plan_util_1.isPlanWriteExecutionStepInMutationFlow)(nextStep)) {
        return true;
    }
    return (0, task_plan_util_1.isPlanWriteToolStep)((0, task_plan_util_1.getPendingPlanToolStep)(afterFinalize));
}
function isPlanDraftSummarizeBeforeWrite(ctx) {
    const { step, workflowNodeAction } = (0, task_plan_util_1.resolvePlanExecutionStep)(ctx);
    if (!ctx.taskPlan || !(0, task_plan_util_1.isPlanTextGenerationStep)(step, workflowNodeAction)) {
        return false;
    }
    if (!(0, task_plan_util_1.isPlanPresentSummarizeStep)(step, ctx.workflowNodeDefs)) {
        return false;
    }
    const afterFinalize = (0, task_plan_util_1.finalizePlanAfterSummarize)(ctx.taskPlan);
    if (!afterFinalize) {
        return false;
    }
    return isMutationStepAfterPresentSummarize(afterFinalize);
}
exports.isPlanDraftSummarizeBeforeWrite = isPlanDraftSummarizeBeforeWrite;
function isPlanDraftToolObservationDump(text) {
    const trimmed = text.trim();
    if (!trimmed) {
        return false;
    }
    if (/^\[[^\]]+\]\s*(\{|\[)/.test(trimmed)) {
        return true;
    }
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
            JSON.parse(trimmed);
            return true;
        }
        catch (_a) {
            return false;
        }
    }
    return false;
}
exports.isPlanDraftToolObservationDump = isPlanDraftToolObservationDump;
function isUsablePlanDraftUserFacingDraft(draft) {
    const trimmed = draft.trim();
    if (!trimmed || isPlanDraftToolObservationDump(trimmed)) {
        return false;
    }
    const submitCandidate = (0, write_tool_draft_injection_util_1.extractSubmitTextFromDraftReply)(trimmed) || trimmed;
    if (!(0, write_tool_draft_injection_util_1.isUsablePlanDraftSubmitText)(submitCandidate)) {
        return false;
    }
    if (submitCandidate.replace(/\s/g, '').length <
        MIN_PLAN_DRAFT_SUBSTANTIVE_CHARS) {
        return false;
    }
    return true;
}
exports.isUsablePlanDraftUserFacingDraft = isUsablePlanDraftUserFacingDraft;
function isUsablePlanMutationPreviewDraft(draft, writeTool, machineSubmitText) {
    const trimmed = draft.trim();
    if (!trimmed || isPlanDraftToolObservationDump(trimmed)) {
        return false;
    }
    if (writeTool && (0, write_tool_draft_injection_util_1.writeToolHasSubmitBodyPath)(writeTool)) {
        if (!isUsablePlanDraftUserFacingDraft(trimmed)) {
            return false;
        }
        if ((machineSubmitText === null || machineSubmitText === void 0 ? void 0 : machineSubmitText.trim()) &&
            (0, plan_present_display_util_1.isBareMachineSubmitDisplay)(trimmed, machineSubmitText)) {
            return false;
        }
        return true;
    }
    return trimmed.replace(/\s/g, '').length >= MIN_PLAN_DRAFT_SUBSTANTIVE_CHARS;
}
exports.isUsablePlanMutationPreviewDraft = isUsablePlanMutationPreviewDraft;
function resolveSubmitTextForWriteTool(input) {
    const fromArgs = input.writeTool
        ? (0, write_tool_draft_injection_util_1.extractSubmitTextFromWriteArguments)(input.arguments, input.writeTool)
        : null;
    if (fromArgs && (0, write_tool_draft_injection_util_1.isUsablePlanDraftSubmitText)(fromArgs)) {
        return fromArgs.trim();
    }
    const fromDraft = (0, write_tool_draft_injection_util_1.extractSubmitTextFromDraftReply)(input.draftReply);
    if ((0, write_tool_draft_injection_util_1.isUsablePlanDraftSubmitText)(fromDraft)) {
        return fromDraft.trim();
    }
    const trimmedDraft = input.draftReply.trim();
    return (0, write_tool_draft_injection_util_1.isUsablePlanDraftSubmitText)(trimmedDraft) ? trimmedDraft : '';
}
exports.resolveSubmitTextForWriteTool = resolveSubmitTextForWriteTool;
function buildFallbackUserDraftFromSubmitText(submitText) {
    return submitText.trim();
}
exports.buildFallbackUserDraftFromSubmitText = buildFallbackUserDraftFromSubmitText;
function finalizeComposedWritePendingCallResult(input) {
    var _a, _b, _c, _d, _e, _f;
    const pageContextEntityId = typeof ((_b = (_a = input.pageContext) === null || _a === void 0 ? void 0 : _a.entity) === null || _b === void 0 ? void 0 : _b.id) === 'string'
        ? input.pageContext.entity.id.trim() || null
        : null;
    const composedArgsSummary = summarizeRecordForComposeGateLog(input.composed.arguments);
    const diagnosticBase = {
        composedTool: input.composed.tool,
        composedPlanStepId: (_c = input.composed.planStepId) !== null && _c !== void 0 ? _c : null,
        taskPlanCurrentStepId: (_e = (_d = (0, task_plan_util_1.getPendingPlanStep)(input.taskPlan)) === null || _d === void 0 ? void 0 : _d.id) !== null && _e !== void 0 ? _e : null,
        composedArgsSummary,
        normalizedArgsSummary: composedArgsSummary,
        submitTextPreview: null,
        submitTextUsable: false,
        pageContextEntityId,
        writeToolResolved: false,
    };
    const writeTool = resolveWriteToolDef(input.composed.tool, input.scopedTools, input.taskPlan);
    if (!writeTool) {
        return {
            call: null,
            failureReason: `write_tool_not_in_plan_scope:${input.composed.tool}`,
            diagnostic: diagnosticBase,
        };
    }
    const isReadToolObservation = (0, plan_compose_write_util_1.buildReadToolObservationMatcher)(input.scopedTools);
    const normalizedArgs = (0, write_tool_draft_injection_util_2.normalizeWriteToolArguments)(input.composed.arguments, writeTool, input.observations, {
        isReadToolObservation,
        pageContext: (_f = input.pageContext) !== null && _f !== void 0 ? _f : null,
    });
    const normalizedArgsSummary = summarizeRecordForComposeGateLog(normalizedArgs);
    const payload = {
        tool: input.composed.tool,
        arguments: normalizedArgs,
    };
    const diagnosticWithNormalize = Object.assign(Object.assign({}, diagnosticBase), { normalizedArgsSummary, writeToolResolved: true });
    if ((0, write_tool_draft_injection_util_1.writeToolHasSubmitBodyPath)(writeTool)) {
        const submitText = (0, write_tool_draft_injection_util_1.extractSubmitTextFromWriteArguments)(normalizedArgs, writeTool);
        const submitTextUsable = !!submitText && (0, write_tool_draft_injection_util_1.isUsablePlanDraftSubmitText)(submitText);
        const diagnosticWithSubmit = Object.assign(Object.assign({}, diagnosticWithNormalize), { submitTextPreview: previewSubmitTextForComposeGateLog(submitText), submitTextUsable });
        if (!submitTextUsable) {
            return {
                call: null,
                failureReason: submitText
                    ? 'submit_text_not_usable'
                    : 'submit_text_missing',
                diagnostic: diagnosticWithSubmit,
            };
        }
        const finalized = finalizePlanPendingWriteToolCall({
            payload,
            taskPlan: input.taskPlan,
            scopedTools: input.scopedTools,
            submitText: submitText.trim(),
        });
        return Object.assign(Object.assign({}, finalized), { diagnostic: diagnosticWithSubmit });
    }
    const finalized = finalizePlanPendingWriteToolCallFromComposedArgs({
        payload,
        taskPlan: input.taskPlan,
        scopedTools: input.scopedTools,
    });
    return Object.assign(Object.assign({}, finalized), { diagnostic: diagnosticWithNormalize });
}
exports.finalizeComposedWritePendingCallResult = finalizeComposedWritePendingCallResult;
function finalizeComposedWritePendingCall(input) {
    return finalizeComposedWritePendingCallResult(input).call;
}
exports.finalizeComposedWritePendingCall = finalizeComposedWritePendingCall;
function resolveComposedWriteGateCallResult(input) {
    var _a, _b, _c;
    if (!input.taskPlan) {
        return {
            call: null,
            failureReason: 'missing_task_plan',
            stage: 'missing_task_plan',
            diagnostic: emptyComposedWriteGateDiagnostic(),
        };
    }
    const composed = (0, plan_compose_write_util_1.resolveLatestPlanComposeWrite)(input.observations);
    if (!composed) {
        return {
            call: null,
            failureReason: 'missing_plan_compose_write',
            stage: 'missing_plan_compose_write',
            diagnostic: emptyComposedWriteGateDiagnostic({
                taskPlanCurrentStepId: (_b = (_a = (0, task_plan_util_1.getPendingPlanStep)(input.taskPlan)) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null,
            }),
        };
    }
    const finalized = finalizeComposedWritePendingCallResult({
        composed,
        taskPlan: input.taskPlan,
        scopedTools: input.scopedTools,
        observations: input.observations,
        pageContext: (_c = input.pageContext) !== null && _c !== void 0 ? _c : null,
    });
    return Object.assign(Object.assign({}, finalized), { stage: finalized.call ? 'ok' : 'finalize_failed' });
}
exports.resolveComposedWriteGateCallResult = resolveComposedWriteGateCallResult;
function resolveComposedWriteGateCall(input) {
    return resolveComposedWriteGateCallResult(input).call;
}
exports.resolveComposedWriteGateCall = resolveComposedWriteGateCall;
function resolvePendingWriteForPlanWriteStepResult(input) {
    var _a, _b, _c;
    const pendingToolStep = (0, task_plan_util_1.getPendingPlanToolStep)(input.taskPlan);
    if (!input.taskPlan || !(0, task_plan_util_1.isPlanWriteExecutionStepInMutationFlow)(pendingToolStep)) {
        return {
            call: null,
            failureReason: 'not_write_fallback_step',
            source: null,
        };
    }
    const composed = (0, plan_compose_write_util_1.resolveLatestPlanComposeWrite)(input.observations);
    if (composed) {
        const gate = finalizeComposedWritePendingCallResult({
            composed,
            taskPlan: input.taskPlan,
            scopedTools: input.scopedTools,
            observations: input.observations,
            pageContext: (_a = input.pageContext) !== null && _a !== void 0 ? _a : null,
        });
        if (gate.call) {
            return {
                call: gate.call,
                source: 'compose',
                gateDiagnostic: gate.diagnostic,
            };
        }
        return {
            call: null,
            failureReason: gate.failureReason,
            source: 'compose',
            gateDiagnostic: gate.diagnostic,
        };
    }
    const draftReply = (0, plan_draft_reply_util_1.resolveLatestPlanDraftReply)(input.observations);
    const pending = draftReply === null || draftReply === void 0 ? void 0 : draftReply.pendingWriteToolCall;
    if (!(pending === null || pending === void 0 ? void 0 : pending.tool) || !pending.arguments || typeof pending.arguments !== 'object') {
        return {
            call: null,
            failureReason: 'missing_plan_compose_write_and_draft_reply',
            source: null,
        };
    }
    const gate = finalizeComposedWritePendingCallResult({
        composed: {
            tool: pending.tool,
            arguments: pending.arguments,
            planStepId: (_b = pendingToolStep === null || pendingToolStep === void 0 ? void 0 : pendingToolStep.id) !== null && _b !== void 0 ? _b : null,
        },
        taskPlan: input.taskPlan,
        scopedTools: input.scopedTools,
        observations: input.observations,
        pageContext: (_c = input.pageContext) !== null && _c !== void 0 ? _c : null,
    });
    if (gate.call) {
        return {
            call: gate.call,
            source: 'draft_reply',
            gateDiagnostic: gate.diagnostic,
        };
    }
    return {
        call: null,
        failureReason: gate.failureReason,
        source: 'draft_reply',
        gateDiagnostic: gate.diagnostic,
    };
}
exports.resolvePendingWriteForPlanWriteStepResult = resolvePendingWriteForPlanWriteStepResult;
function resolvePendingWriteForPlanWriteStep(input) {
    return resolvePendingWriteForPlanWriteStepResult(input).call;
}
exports.resolvePendingWriteForPlanWriteStep = resolvePendingWriteForPlanWriteStep;
function finalizeDraftReplyPendingWriteCall(input) {
    var _a;
    const writeTool = resolveWriteToolDef(input.tool, input.scopedTools, input.taskPlan);
    if (!writeTool) {
        return null;
    }
    const composed = {
        tool: writeTool.name,
        arguments: input.arguments,
        planStepId: null,
    };
    return finalizeComposedWritePendingCall({
        composed,
        taskPlan: input.taskPlan,
        scopedTools: input.scopedTools,
        observations: input.observations,
        pageContext: (_a = input.pageContext) !== null && _a !== void 0 ? _a : null,
    });
}
exports.finalizeDraftReplyPendingWriteCall = finalizeDraftReplyPendingWriteCall;
function resolvePendingWriteFromComposedObservation(input) {
    var _a;
    if (!input.taskPlan ||
        !(0, task_plan_util_1.isPlanWriteExecutionStepInMutationFlow)((0, task_plan_util_1.getPendingPlanToolStep)(input.taskPlan))) {
        return null;
    }
    const composed = (0, plan_compose_write_util_1.resolveLatestPlanComposeWrite)(input.observations);
    if (!composed) {
        return null;
    }
    return finalizeComposedWritePendingCall({
        composed,
        taskPlan: input.taskPlan,
        scopedTools: input.scopedTools,
        observations: input.observations,
        pageContext: (_a = input.pageContext) !== null && _a !== void 0 ? _a : null,
    });
}
exports.resolvePendingWriteFromComposedObservation = resolvePendingWriteFromComposedObservation;
function syncPlanPresentSubmitTextForGate(input) {
    const writeTool = resolveWriteToolForGateCall(input);
    if (!writeTool) {
        return input.submitText;
    }
    const fromArgs = (0, write_tool_draft_injection_util_1.extractSubmitTextFromWriteArguments)(input.gateCall.arguments, writeTool);
    if (fromArgs && (0, write_tool_draft_injection_util_1.isUsablePlanDraftSubmitText)(fromArgs)) {
        return fromArgs.trim();
    }
    return input.submitText;
}
exports.syncPlanPresentSubmitTextForGate = syncPlanPresentSubmitTextForGate;
function resolveWriteToolForGateCall(input) {
    const composed = (0, plan_compose_write_util_1.resolveLatestPlanComposeWrite)(input.observations);
    if (composed != null) {
        return resolveWriteToolDef(composed.tool, input.scopedTools, input.taskPlan);
    }
    return input.scopedTools.find((tool) => tool.name === input.gateCall.name);
}
function resolvePlanDraftReplyContentForGateObservation(input) {
    var _a;
    if (!input.writeTool) {
        return null;
    }
    let submitText = input.submitText.trim();
    const fromArgs = (0, write_tool_draft_injection_util_1.extractSubmitTextFromWriteArguments)(input.gateCall.arguments, input.writeTool);
    if (!submitText && fromArgs && (0, write_tool_draft_injection_util_1.isUsablePlanDraftSubmitText)(fromArgs)) {
        submitText = fromArgs.trim();
    }
    const userMarkdown = input.draftReply.trim();
    if (userMarkdown && !isPlanDraftToolObservationDump(userMarkdown)) {
        const resolvedSubmit = submitText && (0, write_tool_draft_injection_util_1.isUsablePlanDraftSubmitText)(submitText)
            ? submitText
            : fromArgs && (0, write_tool_draft_injection_util_1.isUsablePlanDraftSubmitText)(fromArgs)
                ? fromArgs.trim()
                : submitText;
        return {
            draftReply: userMarkdown,
            submitText: (_a = resolvedSubmit === null || resolvedSubmit === void 0 ? void 0 : resolvedSubmit.trim()) !== null && _a !== void 0 ? _a : '',
        };
    }
    if (submitText && (0, write_tool_draft_injection_util_1.isUsablePlanDraftSubmitText)(submitText)) {
        return {
            draftReply: buildFallbackUserDraftFromSubmitText(submitText),
            submitText,
        };
    }
    return null;
}
exports.resolvePlanDraftReplyContentForGateObservation = resolvePlanDraftReplyContentForGateObservation;
function buildWriteConfirmationDetailMarkdown(gateCall, writeTool) {
    return (0, write_tool_draft_injection_util_1.formatWriteToolArgumentsForUserPreview)(gateCall.arguments, writeTool, writeTool.description).trim();
}
exports.buildWriteConfirmationDetailMarkdown = buildWriteConfirmationDetailMarkdown;
function finalizePlanPendingWriteToolCall(input) {
    const submitText = input.submitText.trim();
    if (!(0, write_tool_draft_injection_util_1.isUsablePlanDraftSubmitText)(submitText)) {
        return { call: null, failureReason: 'invalid_submit_text' };
    }
    if (!input.taskPlan) {
        return { call: null, failureReason: 'missing_task_plan' };
    }
    const writeTool = resolveWriteToolDef(input.payload.tool, input.scopedTools, input.taskPlan);
    if (!writeTool) {
        return {
            call: null,
            failureReason: `write_tool_not_allowed:${input.payload.tool}`,
        };
    }
    const args = (0, write_tool_draft_injection_util_1.injectDraftIntoWriteToolArguments)(input.payload.arguments, submitText, writeTool);
    return finalizePlanPendingWriteToolCallWithArgs({
        payload: { tool: writeTool.name, arguments: args },
        taskPlan: input.taskPlan,
        scopedTools: input.scopedTools,
        requireSubmitBody: true,
        writeTool,
    });
}
exports.finalizePlanPendingWriteToolCall = finalizePlanPendingWriteToolCall;
function finalizePlanPendingWriteToolCallFromComposedArgs(input) {
    if (!input.taskPlan) {
        return { call: null, failureReason: 'missing_task_plan' };
    }
    const writeTool = resolveWriteToolDef(input.payload.tool, input.scopedTools, input.taskPlan);
    if (!writeTool) {
        return {
            call: null,
            failureReason: `write_tool_not_allowed:${input.payload.tool}`,
        };
    }
    return finalizePlanPendingWriteToolCallWithArgs({
        payload: input.payload,
        taskPlan: input.taskPlan,
        scopedTools: input.scopedTools,
        requireSubmitBody: false,
        writeTool,
    });
}
exports.finalizePlanPendingWriteToolCallFromComposedArgs = finalizePlanPendingWriteToolCallFromComposedArgs;
function finalizePlanPendingWriteToolCallWithArgs(input) {
    const args = Object.assign({}, input.payload.arguments);
    const missingRequired = (0, write_tool_draft_injection_util_1.findMissingRequiredWriteToolArgPath)(args, input.writeTool);
    if (missingRequired) {
        return {
            call: null,
            failureReason: `required_args_missing:${missingRequired}`,
        };
    }
    if (input.requireSubmitBody &&
        !(0, write_tool_draft_injection_util_1.writeToolArgsContainSubmitText)(args, input.writeTool)) {
        return { call: null, failureReason: 'submit_text_not_in_args' };
    }
    return {
        call: { name: input.writeTool.name, arguments: args },
    };
}
function buildPlanPresentUserLayer(input) {
    const llmDraft = input.draftReply.trim();
    const taskPlanAfterFinalize = input.taskPlanBeforeFinalize
        ? (0, task_plan_util_1.finalizePlanAfterSummarize)(input.taskPlanBeforeFinalize)
        : null;
    if (!taskPlanAfterFinalize) {
        return { draftReply: llmDraft, submitText: '' };
    }
    const writeTool = resolveWriteToolDef(input.composed.tool, input.scopedTools, taskPlanAfterFinalize);
    if (!writeTool) {
        return { draftReply: llmDraft, submitText: '' };
    }
    const hasSubmitBody = (0, write_tool_draft_injection_util_1.writeToolHasSubmitBodyPath)(writeTool);
    const submitText = hasSubmitBody
        ? resolveSubmitTextForWriteTool({
            draftReply: llmDraft,
            arguments: input.composed.arguments,
            writeTool,
        })
        : '';
    return {
        draftReply: llmDraft,
        submitText,
    };
}
exports.buildPlanPresentUserLayer = buildPlanPresentUserLayer;
//# sourceMappingURL=plan-draft-summarize.util.js.map