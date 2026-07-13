"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executePageActionLlmDslStream = exports.canPageActionDispatchDsl = exports.canPageActionUseDslStream = void 0;
const plan_reason_host_machine_layer_util_1 = require("../agent-engine/engine/main/plan-present/plan-reason-host-machine-layer.util");
const host_action_instant_dispatch_util_1 = require("../host-bridge/host-action-instant-dispatch.util");
const host_tool_args_from_llm_util_1 = require("../host-bridge/host-tool-args-from-llm.util");
const host_tool_delivery_contract_util_1 = require("../host-bridge/host-tool-delivery-contract.util");
const host_tool_stream_env_util_1 = require("../host-bridge/host-tool-stream-env.util");
const host_tool_stream_session_util_1 = require("../host-bridge/host-tool-stream-session.util");
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
function withStructuredArgsHint(messages, argsSchema) {
    const hint = '\n\n[Host tool args] Reply with one JSON object matching this schema only ' +
        '(no markdown fences, no commentary):\n' +
        JSON.stringify(argsSchema);
    if (messages.length === 0) {
        return [{ role: 'system', content: hint.trim() }];
    }
    const [first, ...rest] = messages;
    if ((first === null || first === void 0 ? void 0 : first.role) === 'system') {
        return [{ role: 'system', content: `${first.content}${hint}` }, ...rest];
    }
    return [{ role: 'system', content: hint.trim() }, ...messages];
}
function canPageActionUseDslStream(hostTool) {
    return canPageActionDispatchDsl(hostTool);
}
exports.canPageActionUseDslStream = canPageActionUseDslStream;
function canPageActionDispatchDsl(hostTool) {
    const contract = (0, host_tool_delivery_contract_util_1.resolveHostToolDeliveryContract)(hostTool.definition);
    return (0, host_tool_delivery_contract_util_1.hostToolContractWillDispatchLive)(contract, (0, host_tool_stream_env_util_1.isHostToolStreamEnabled)());
}
exports.canPageActionDispatchDsl = canPageActionDispatchDsl;
async function executePageActionLlmDslStream(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    const recorder = input.stepRecorder;
    const contract = (0, host_tool_delivery_contract_util_1.resolveHostToolDeliveryContract)(input.hostTool.definition);
    const streamEnabled = (0, host_tool_stream_env_util_1.isHostToolStreamEnabled)();
    const willDispatchLive = (0, host_tool_delivery_contract_util_1.hostToolContractWillDispatchLive)(contract, streamEnabled);
    const fillStreamLive = contract.delivery === 'fill_stream' && streamEnabled;
    const fillTools = contract.streamablePath != null
        ? [
            {
                name: input.hostTool.definition.name,
                streamablePath: contract.streamablePath,
            },
        ]
        : [];
    if (contract.delivery === 'fill_stream' && !streamEnabled) {
        recorder === null || recorder === void 0 ? void 0 : recorder.record({
            type: 'dsl',
            name: 'stream.skipped',
            status: 'skipped',
            detail: { reason: 'host_tool_stream_disabled', delivery: contract.delivery },
        });
    }
    else if (contract.delivery === 'observation') {
        recorder === null || recorder === void 0 ? void 0 : recorder.record({
            type: 'dsl',
            name: 'stream.skipped',
            status: 'skipped',
            detail: { reason: 'observation_only', delivery: contract.delivery },
        });
    }
    else {
        recorder === null || recorder === void 0 ? void 0 : recorder.record({
            type: 'dsl',
            name: 'delivery.resolved',
            status: 'ok',
            detail: {
                delivery: contract.delivery,
                produceMode: contract.produceMode,
                streamablePath: contract.streamablePath,
                willDispatchLive,
            },
        });
    }
    let model = null;
    let promptTokens = null;
    let completionTokens = null;
    let appendCount = 0;
    let fillText = '';
    let displayText = '';
    let dslOutcome = 'skipped';
    let streamSession = null;
    const publish = (0, page_action_inline_sse_util_1.createInlineHostActionPublisher)(input.sseSink, {
        onPayload: (payload) => {
            recorder === null || recorder === void 0 ? void 0 : recorder.recordHostActionPayload(payload);
        },
    });
    if (fillStreamLive) {
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
    const llmMessages = contract.produceMode === 'structured'
        ? withStructuredArgsHint(input.messages, input.hostTool.definition.argsSchema)
        : input.messages;
    const startName = (_c = (_b = input.llmAudit) === null || _b === void 0 ? void 0 : _b.startName) !== null && _c !== void 0 ? _c : 'streamChat.start';
    const endName = (_e = (_d = input.llmAudit) === null || _d === void 0 ? void 0 : _d.endName) !== null && _e !== void 0 ? _e : 'streamChat.end';
    recorder === null || recorder === void 0 ? void 0 : recorder.recordLlm(startName, {
        messageCount: llmMessages.length,
        delivery: contract.delivery,
        produceMode: contract.produceMode,
        streamableTools: fillTools.map((tool) => tool.name),
        dslDispatch: willDispatchLive,
    });
    try {
        const llmFill = await (0, plan_reason_host_machine_layer_util_1.runHostFillLlmStream)({
            llmService: input.llmService,
            messages: llmMessages,
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
        displayText = llmFill.fillText;
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
            delivery: contract.delivery,
            dslDispatch: willDispatchLive,
        });
        if (fillStreamLive && streamSession) {
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
                        delivery: contract.delivery,
                        rawAccumulatedLen: llmFill.rawAccumulatedLen,
                        streamResultContentLen: (_q = (_p = llmFill.streamResult.content) === null || _p === void 0 ? void 0 : _p.length) !== null && _q !== void 0 ? _q : 0,
                    },
                });
            }
        }
        else if (contract.delivery === 'instant') {
            const structuredSource = llmFill.rawAccumulatedText.trim() ||
                ((_r = llmFill.streamResult.content) === null || _r === void 0 ? void 0 : _r.trim()) ||
                fillText;
            const args = (0, host_tool_args_from_llm_util_1.parseHostToolArgsFromLlmText)({
                text: structuredSource,
                argsSchema: input.hostTool.definition.argsSchema,
            });
            if (args) {
                const hostTools = [
                    { name: input.hostTool.definition.name, args },
                ];
                fillText = JSON.stringify(args);
                displayText = (0, host_tool_args_from_llm_util_1.buildHostToolArgsDisplayText)(args);
                (0, host_action_instant_dispatch_util_1.dispatchHostActionInstant)(publish, `page-action:${input.actionRunId}`, {
                    pageContext: input.pageContext,
                    runId: input.actionRunId,
                    turnId: input.actionRunId,
                    hostTools,
                    reason: input.reason,
                    streamId: input.streamId,
                    generation: input.generation,
                });
                dslOutcome = 'dispatched';
                recorder === null || recorder === void 0 ? void 0 : recorder.record({
                    type: 'dsl',
                    name: 'instant.dispatched',
                    status: 'ok',
                    detail: {
                        delivery: 'instant',
                        tool: input.hostTool.definition.name,
                        argKeys: Object.keys(args),
                    },
                });
            }
            else {
                dslOutcome = 'failed';
                recorder === null || recorder === void 0 ? void 0 : recorder.record({
                    type: 'dsl',
                    name: 'instant.failed',
                    status: 'failed',
                    detail: {
                        reason: 'structured_args_parse_or_validate_failed',
                        delivery: 'instant',
                        fillTextLen: structuredSource.length,
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
        displayText: displayText || fillText,
        dslOutcome,
        model,
        promptTokens,
        completionTokens,
        appendCount,
        streamable: contract.delivery === 'fill_stream',
        delivery: contract.delivery,
    };
}
exports.executePageActionLlmDslStream = executePageActionLlmDslStream;
//# sourceMappingURL=page-action-llm-dsl-stream.util.js.map