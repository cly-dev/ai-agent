"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executePageActionLlmDslStream = exports.canPageActionUseDslStream = void 0;
const plan_reason_host_machine_layer_util_1 = require("../agent-engine/engine/main/plan-present/plan-reason-host-machine-layer.util");
const host_tool_stream_env_util_1 = require("../host-bridge/host-tool-stream-env.util");
const host_tool_stream_session_util_1 = require("../host-bridge/host-tool-stream-session.util");
const host_tool_stream_target_util_1 = require("../host-bridge/host-tool-stream-target.util");
const llm_response_meta_util_1 = require("../llm/llm-response-meta.util");
const page_action_inline_sse_util_1 = require("./page-action-inline-sse.util");
function toHostToolInvocations(fills) {
    return fills.map((fill) => ({
        name: fill.tool,
        args: fill.arguments,
    }));
}
function responseMetaFromStreamRaw(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return undefined;
    }
    const row = raw;
    const responseMeta = row.response_metadata;
    if (responseMeta && typeof responseMeta === 'object' && !Array.isArray(responseMeta)) {
        return responseMeta;
    }
    return row;
}
function resolveDslOutcomeWithoutDispatch(fillText) {
    return fillText.trim().length > 0 ? 'skipped' : 'failed';
}
function canPageActionUseDslStream(hostTool) {
    if (!(0, host_tool_stream_env_util_1.isHostToolStreamEnabled)()) {
        return false;
    }
    const fillTools = (0, host_tool_stream_target_util_1.resolvePlanReasonHostFillTools)({
        hostTools: [hostTool.definition],
        allowedToolNames: new Set([hostTool.definition.name]),
    });
    return fillTools.length > 0;
}
exports.canPageActionUseDslStream = canPageActionUseDslStream;
async function executePageActionLlmDslStream(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    const recorder = input.stepRecorder;
    const fillTools = (0, host_tool_stream_target_util_1.resolvePlanReasonHostFillTools)({
        hostTools: [input.hostTool.definition],
        allowedToolNames: new Set([input.hostTool.definition.name]),
    });
    const hasStreamableField = fillTools.length > 0;
    const canDispatchDsl = hasStreamableField && (0, host_tool_stream_env_util_1.isHostToolStreamEnabled)();
    let model = null;
    let promptTokens = null;
    let completionTokens = null;
    let appendCount = 0;
    let fillText = '';
    let dslOutcome = 'skipped';
    let streamSession = null;
    if (!hasStreamableField) {
        recorder === null || recorder === void 0 ? void 0 : recorder.record({
            type: 'dsl',
            name: 'stream.skipped',
            status: 'skipped',
            detail: { reason: 'no_streamable_string_field' },
        });
    }
    else if (!(0, host_tool_stream_env_util_1.isHostToolStreamEnabled)()) {
        recorder === null || recorder === void 0 ? void 0 : recorder.record({
            type: 'dsl',
            name: 'stream.skipped',
            status: 'skipped',
            detail: { reason: 'host_tool_stream_disabled' },
        });
    }
    if (canDispatchDsl) {
        const publish = (0, page_action_inline_sse_util_1.createInlineHostActionPublisher)(input.sseSink, {
            onPayload: (payload) => {
                recorder === null || recorder === void 0 ? void 0 : recorder.recordHostActionPayload(payload);
            },
        });
        streamSession = new host_tool_stream_session_util_1.HostToolStreamSession({
            publish,
            sessionId: `page-action:${input.actionRunId}`,
            pageContext: (_a = input.pageContext) !== null && _a !== void 0 ? _a : {},
            runId: input.actionRunId,
            turnId: input.actionRunId,
            reason: input.reason,
            generation: input.generation,
        });
        streamSession.begin({
            streamId: input.streamId,
            tools: fillTools,
            reason: input.reason,
        });
    }
    const textSession = (0, plan_reason_host_machine_layer_util_1.createPlanReasonHostFillStreamTextSession)({
        onSanitizedDelta: (delta) => {
            streamSession === null || streamSession === void 0 ? void 0 : streamSession.appendFillChunk(delta);
        },
    });
    const startName = (_c = (_b = input.llmAudit) === null || _b === void 0 ? void 0 : _b.startName) !== null && _c !== void 0 ? _c : 'streamChat.start';
    const endName = (_e = (_d = input.llmAudit) === null || _d === void 0 ? void 0 : _d.endName) !== null && _e !== void 0 ? _e : 'streamChat.end';
    recorder === null || recorder === void 0 ? void 0 : recorder.recordLlm(startName, {
        messageCount: input.messages.length,
        streamableTools: fillTools.map((tool) => tool.name),
        dslDispatch: canDispatchDsl,
    });
    try {
        const llmFill = await (0, plan_reason_host_machine_layer_util_1.runHostFillLlmStream)({
            llmService: input.llmService,
            messages: input.messages,
            textSession,
            signal: input.signal,
            budgetHints: input.budgetHints,
            onLlmDelta: (delta) => {
                var _a;
                (_a = input.onLlmDelta) === null || _a === void 0 ? void 0 : _a.call(input, delta);
            },
        });
        model = llmFill.model;
        fillText = llmFill.fillText;
        appendCount = llmFill.appendCount;
        const responseMeta = responseMetaFromStreamRaw(llmFill.streamResult.raw);
        const usage = (0, llm_response_meta_util_1.extractLlmTokenUsageFromResponseMeta)(responseMeta);
        promptTokens = (_f = usage === null || usage === void 0 ? void 0 : usage.promptTokens) !== null && _f !== void 0 ? _f : null;
        completionTokens = (_g = usage === null || usage === void 0 ? void 0 : usage.completionTokens) !== null && _g !== void 0 ? _g : null;
        if (!model) {
            model = (0, llm_response_meta_util_1.resolveLlmModelNameFromResponseMeta)(responseMeta);
        }
        recorder === null || recorder === void 0 ? void 0 : recorder.recordLlm(endName, {
            model,
            appendCount,
            sessionFillTextLen: fillText.length,
            streamResultContentLen: (_j = (_h = llmFill.streamResult.content) === null || _h === void 0 ? void 0 : _h.length) !== null && _j !== void 0 ? _j : 0,
            rawAccumulatedLen: llmFill.rawAccumulatedLen,
            reconciledFromStreamResult: llmFill.reconciledFromStreamResult,
            fellBackToInvoke: (_l = (_k = llmFill.streamResult.streamMeta) === null || _k === void 0 ? void 0 : _k.fellBackToInvoke) !== null && _l !== void 0 ? _l : false,
            llmEmittedDeltaCount: (_o = (_m = llmFill.streamResult.streamMeta) === null || _m === void 0 ? void 0 : _m.emittedDeltaCount) !== null && _o !== void 0 ? _o : null,
            promptTokens,
            completionTokens,
            dslDispatch: canDispatchDsl,
        });
        if (canDispatchDsl && streamSession) {
            const fills = (0, plan_reason_host_machine_layer_util_1.buildPlanHostFillsFromMachineText)({
                text: fillText,
                fillTools,
                allowedToolNames: new Set([input.hostTool.definition.name]),
            });
            if (fills.length > 0) {
                streamSession.finalize({
                    hostTools: toHostToolInvocations(fills),
                    reason: input.reason,
                });
                dslOutcome = 'dispatched';
            }
            else {
                streamSession.abort({ emitSessionEnd: streamSession.hasBegun });
                dslOutcome = 'failed';
                recorder === null || recorder === void 0 ? void 0 : recorder.record({
                    type: 'dsl',
                    name: 'stream.failed',
                    status: 'failed',
                    detail: {
                        reason: 'empty_fill_after_llm',
                        rawAccumulatedLen: llmFill.rawAccumulatedLen,
                        streamResultContentLen: (_q = (_p = llmFill.streamResult.content) === null || _p === void 0 ? void 0 : _p.length) !== null && _q !== void 0 ? _q : 0,
                    },
                });
            }
        }
        else {
            dslOutcome = resolveDslOutcomeWithoutDispatch(fillText);
        }
    }
    catch (error) {
        if ((streamSession === null || streamSession === void 0 ? void 0 : streamSession.hasBegun) && !streamSession.isClosed) {
            streamSession.abort({ emitSessionEnd: true });
        }
        throw error;
    }
    return {
        fillText,
        dslOutcome,
        model,
        promptTokens,
        completionTokens,
        appendCount,
        streamable: hasStreamableField,
    };
}
exports.executePageActionLlmDslStream = executePageActionLlmDslStream;
//# sourceMappingURL=page-action-llm-dsl-stream.util.js.map