"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replayPageActionInlineStream = exports.executePageActionHostFill = void 0;
const host_tool_stream_target_util_1 = require("../host-bridge/host-tool-stream-target.util");
const page_action_constants_1 = require("./page-action.constants");
const page_action_inline_sse_util_1 = require("./page-action-inline-sse.util");
const page_action_run_steps_util_1 = require("./page-action-run-steps.util");
const page_action_fill_debug_util_1 = require("./page-action-fill-debug.util");
const page_action_llm_dsl_stream_util_1 = require("./page-action-llm-dsl-stream.util");
const host_tool_stream_session_util_1 = require("../host-bridge/host-tool-stream-session.util");
const plan_reason_host_machine_layer_util_1 = require("../agent-engine/engine/main/plan-present/plan-reason-host-machine-layer.util");
const page_action_inline_sse_util_2 = require("./page-action-inline-sse.util");
function toHostToolInvocations(fills) {
    return fills.map((fill) => ({
        name: fill.tool,
        args: fill.arguments,
    }));
}
function lifecycleBase(input, streamId) {
    var _a;
    return {
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        delivery: 'inline_stream',
        generation: input.generation,
        streamId,
        clientActionId: (_a = input.clientActionId) !== null && _a !== void 0 ? _a : null,
    };
}
async function executePageActionHostFill(llmService, input) {
    var _a, _b;
    const recorder = (_a = input.stepRecorder) !== null && _a !== void 0 ? _a : new page_action_run_steps_util_1.PageActionRunStepRecorder();
    const terminalLifecycle = (_b = input.terminalLifecycle) !== null && _b !== void 0 ? _b : 'self';
    const fillTools = (0, host_tool_stream_target_util_1.resolvePlanReasonHostFillTools)({
        hostTools: [input.hostTool.definition],
        allowedToolNames: new Set([input.hostTool.definition.name]),
    });
    const streamId = (0, page_action_constants_1.buildPageActionStreamId)({
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        segment: input.streamIdSegment,
    });
    const probe = (0, page_action_fill_debug_util_1.createPageActionFillStreamProbe)({
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        streamId,
    });
    let model = null;
    let promptTokens = null;
    let completionTokens = null;
    let llmCallCount = 0;
    let appendCount = 0;
    const sink = input.sseSink;
    const emitOwnLifecycle = terminalLifecycle === 'self';
    if (emitOwnLifecycle) {
        (0, page_action_inline_sse_util_1.writePageActionLifecycle)(sink, Object.assign({ phase: 'started' }, lifecycleBase(input, streamId)), recorder);
    }
    let dslOutcome = 'skipped';
    let fillText = '';
    const canDispatchDsl = fillTools.length > 0;
    try {
        llmCallCount += 1;
        (0, page_action_fill_debug_util_1.logPageActionFillStart)(probe);
        const streamResult = await (0, page_action_llm_dsl_stream_util_1.executePageActionLlmDslStream)({
            llmService,
            messages: input.messages,
            sseSink: sink,
            pageContext: input.pageContext,
            actionRunId: input.actionRunId,
            generation: input.generation,
            streamId,
            hostTool: input.hostTool,
            reason: page_action_constants_1.PAGE_ACTION_STREAM_REASON,
            stepRecorder: recorder,
            signal: input.signal,
            budgetHints: { callKind: 'summarize' },
            onLlmDelta: (delta) => {
                (0, page_action_fill_debug_util_1.recordPageActionFillStreamDelta)(probe, delta.contentDelta, delta.done === true);
            },
        });
        model = streamResult.model;
        fillText = streamResult.fillText;
        appendCount = streamResult.appendCount;
        promptTokens = streamResult.promptTokens;
        completionTokens = streamResult.completionTokens;
        dslOutcome = streamResult.dslOutcome;
        (0, page_action_fill_debug_util_1.logPageActionFillStreamEnd)({
            probe,
            model,
            sessionFillTextLen: fillText.length,
            streamResultContentLen: fillText.length,
            appendCount,
            rawAccumulatedLen: fillText.length,
            rawPreview: (0, page_action_fill_debug_util_1.truncateForPageActionLog)(fillText, 2000),
            streamResultPreview: (0, page_action_fill_debug_util_1.truncateForPageActionLog)(fillText, 2000),
            streamMeta: undefined,
        });
        if (dslOutcome === 'dispatched') {
            (0, page_action_fill_debug_util_1.logPageActionFillDispatched)({
                probe,
                fillTextLen: fillText.length,
                appendCount,
                fillTextPreview: (0, page_action_fill_debug_util_1.truncateForPageActionLog)(fillText, 500),
            });
        }
        else if (canDispatchDsl && fillText.trim().length === 0) {
            (0, page_action_fill_debug_util_1.logPageActionFillEmpty)({
                probe,
                model,
                rawAccumulatedLen: 0,
                rawPreview: '',
                sanitizedFillLen: 0,
                streamResultContentLen: 0,
                streamResultPreview: '',
                appendCount,
            });
        }
        if (emitOwnLifecycle) {
            (0, page_action_inline_sse_util_1.writePageActionLifecycle)(sink, Object.assign(Object.assign({ phase: 'completed' }, lifecycleBase(input, streamId)), { text: fillText, dslOutcome }), recorder);
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        (0, page_action_fill_debug_util_1.logPageActionFillError)(probe, error);
        recorder.recordLlm('streamChat.error', { message }, 'failed');
        if (emitOwnLifecycle) {
            (0, page_action_inline_sse_util_1.writePageActionLifecycle)(sink, Object.assign(Object.assign({ phase: 'failed' }, lifecycleBase(input, streamId)), { errorCode: 'LLM_FAILED', errorMessage: message }), recorder);
            (0, page_action_inline_sse_util_1.endInlineSseResponse)(sink);
        }
        throw error;
    }
    if (emitOwnLifecycle) {
        (0, page_action_inline_sse_util_1.endInlineSseResponse)(sink);
    }
    return {
        fillText,
        dslOutcome,
        streamId: canDispatchDsl ? streamId : null,
        model,
        promptTokens,
        completionTokens,
        llmCallCount,
        appendCount,
        steps: recorder.toJson(),
    };
}
exports.executePageActionHostFill = executePageActionHostFill;
async function replayPageActionInlineStream(input) {
    var _a, _b, _c, _d, _e, _f;
    const recorder = (_a = input.stepRecorder) !== null && _a !== void 0 ? _a : new page_action_run_steps_util_1.PageActionRunStepRecorder();
    const sink = input.sseSink;
    const streamId = (_b = input.streamId) !== null && _b !== void 0 ? _b : (0, page_action_constants_1.buildPageActionStreamId)({
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
    });
    const lifecycle = {
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        delivery: 'inline_stream',
        generation: input.generation,
        streamId,
        clientActionId: (_c = input.clientActionId) !== null && _c !== void 0 ? _c : null,
    };
    (0, page_action_inline_sse_util_1.writePageActionLifecycle)(sink, Object.assign({ phase: 'started' }, lifecycle), recorder);
    recorder.record({
        type: 'lifecycle',
        name: 'idempotency_replay',
        detail: { actionRunId: input.actionRunId },
    });
    const fillText = (_e = (_d = input.fillText) === null || _d === void 0 ? void 0 : _d.trim()) !== null && _e !== void 0 ? _e : '';
    if (fillText &&
        input.dslOutcome === 'dispatched' &&
        input.hostTool) {
        const fillTools = (0, host_tool_stream_target_util_1.resolvePlanReasonHostFillTools)({
            hostTools: [input.hostTool.definition],
            allowedToolNames: new Set([input.hostTool.definition.name]),
        });
        if (fillTools.length > 0) {
            const publish = (0, page_action_inline_sse_util_2.createInlineHostActionPublisher)(sink, {
                onPayload: (payload) => {
                    recorder.recordHostActionPayload(payload);
                },
            });
            const streamSession = new host_tool_stream_session_util_1.HostToolStreamSession({
                publish,
                sessionId: `page-action:${input.actionRunId}`,
                pageContext: (_f = input.pageContext) !== null && _f !== void 0 ? _f : {},
                runId: input.actionRunId,
                turnId: input.actionRunId,
                reason: page_action_constants_1.PAGE_ACTION_STREAM_REASON,
                generation: input.generation,
            });
            streamSession.begin({
                streamId,
                tools: fillTools,
                reason: page_action_constants_1.PAGE_ACTION_STREAM_REASON,
            });
            streamSession.appendFillChunk(fillText);
            const fills = (0, plan_reason_host_machine_layer_util_1.buildPlanHostFillsFromMachineText)({
                text: fillText,
                fillTools,
                allowedToolNames: new Set([input.hostTool.definition.name]),
            });
            if (fills.length > 0) {
                streamSession.finalize({
                    hostTools: toHostToolInvocations(fills),
                    reason: page_action_constants_1.PAGE_ACTION_STREAM_REASON,
                });
            }
            else {
                streamSession.abort({ emitSessionEnd: streamSession.hasBegun });
            }
        }
    }
    (0, page_action_inline_sse_util_1.writePageActionLifecycle)(sink, Object.assign(Object.assign({ phase: 'completed' }, lifecycle), { text: fillText, dslOutcome: input.dslOutcome }), recorder);
    (0, page_action_inline_sse_util_1.endInlineSseResponse)(sink);
    return recorder.toJson();
}
exports.replayPageActionInlineStream = replayPageActionInlineStream;
//# sourceMappingURL=page-action-host-fill.executor.js.map