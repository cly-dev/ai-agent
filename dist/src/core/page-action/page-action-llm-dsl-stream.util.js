"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executePageActionLlmDslStream = exports.canPageActionDispatchDsl = exports.canPageActionUseDslStream = void 0;
const plan_reason_host_machine_layer_util_1 = require("../agent-engine/engine/main/plan-present/plan-reason-host-machine-layer.util");
const llm_stream_router_util_1 = require("../agent-engine/engine/llm-stream-router.util");
const host_action_instant_dispatch_util_1 = require("../host-bridge/host-action-instant-dispatch.util");
const host_tool_args_from_llm_util_1 = require("../host-bridge/host-tool-args-from-llm.util");
const host_tool_args_context_catalog_util_1 = require("../host-bridge/host-tool-args-context-catalog.util");
const host_tool_delivery_contract_util_1 = require("../host-bridge/host-tool-delivery-contract.util");
const host_tool_stream_env_util_1 = require("../host-bridge/host-tool-stream-env.util");
const host_tool_stream_session_util_1 = require("../host-bridge/host-tool-stream-session.util");
const llm_response_meta_util_1 = require("../llm/llm-response-meta.util");
const page_action_inline_sse_util_1 = require("./page-action-inline-sse.util");
const page_action_structured_produce_util_1 = require("./page-action-structured-produce.util");
const page_action_run_debug_util_1 = require("./page-action-run-debug.util");
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
function withToolCallTaskMessages(messages, toolName) {
    const prefix = `Task: call host tool \`${toolName}\` exactly once with filled arguments. ` +
        'Follow the system business rules. Do not answer article Q&A; do not invent ids outside context.\n\n';
    return messages.map((message) => {
        if (message.role !== 'user') {
            return message;
        }
        return { role: 'user', content: `${prefix}${message.content}` };
    });
}
function withJsonArgsFallbackMessages(messages, toolName) {
    const prefix = `Task: output only JSON arguments for host tool \`${toolName}\` (no markdown, no Q&A). ` +
        'Follow the system business rules; do not invent ids outside context.\n\n';
    return messages.map((message) => {
        if (message.role !== 'user') {
            return message;
        }
        return { role: 'user', content: `${prefix}${message.content}` };
    });
}
function resolveFallbackAuditStartName(startName) {
    if (startName.endsWith('.start')) {
        return `${startName.slice(0, -'.start'.length)}.fallback.start`;
    }
    return `${startName}.fallback`;
}
function resolveFallbackAuditEndName(endName) {
    if (endName.endsWith('.end')) {
        return `${endName.slice(0, -'.end'.length)}.fallback.end`;
    }
    return `${endName}.fallback`;
}
function addNullableTokenCounts(left, right) {
    if (left == null && right == null) {
        return null;
    }
    return (left !== null && left !== void 0 ? left : 0) + (right !== null && right !== void 0 ? right : 0);
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
function dispatchInstantArgs(input) {
    (0, host_action_instant_dispatch_util_1.dispatchHostActionInstant)(input.publish, `page-action:${input.actionRunId}`, {
        pageContext: input.pageContext,
        runId: input.actionRunId,
        turnId: input.actionRunId,
        hostTools: [{ name: input.toolName, args: input.args }],
        reason: input.reason,
        streamId: input.streamId,
        generation: input.generation,
    });
}
async function executePageActionLlmDslStream(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3;
    const recorder = input.stepRecorder;
    const contract = (0, host_tool_delivery_contract_util_1.resolveHostToolDeliveryContract)(input.hostTool.definition);
    const streamEnabled = (0, host_tool_stream_env_util_1.isHostToolStreamEnabled)();
    const willDispatchLive = (0, host_tool_delivery_contract_util_1.hostToolContractWillDispatchLive)(contract, streamEnabled);
    const fillStreamLive = contract.delivery === 'fill_stream' && streamEnabled;
    const useToolCallPrimary = contract.delivery === 'instant' && contract.produceMode === 'structured';
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
                toolCallPrimary: useToolCallPrimary,
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
    let llmCallCount = 0;
    let toolCallPrimaryFailed = false;
    let allowStreamParseFallback = false;
    const publish = (0, page_action_inline_sse_util_1.createInlineHostActionPublisher)(input.sseSink, {
        onPayload: (payload) => {
            recorder === null || recorder === void 0 ? void 0 : recorder.recordHostActionPayload(payload);
        },
    });
    const startName = (_b = (_a = input.llmAudit) === null || _a === void 0 ? void 0 : _a.startName) !== null && _b !== void 0 ? _b : 'streamChat.start';
    const endName = (_d = (_c = input.llmAudit) === null || _c === void 0 ? void 0 : _c.endName) !== null && _d !== void 0 ? _d : 'streamChat.end';
    if (useToolCallPrimary) {
        const toolName = input.hostTool.definition.name;
        const toolCallMessages = withToolCallTaskMessages(input.messages, toolName);
        recorder === null || recorder === void 0 ? void 0 : recorder.recordLlm(startName, {
            messageCount: toolCallMessages.length,
            delivery: contract.delivery,
            produceMode: 'structured',
            producePath: 'tool_call',
            streamableTools: [],
            dslDispatch: willDispatchLive,
            tool: toolName,
        });
        try {
            const produced = await (0, page_action_structured_produce_util_1.produceHostToolArgsViaToolCall)({
                llmService: input.llmService,
                messages: toolCallMessages,
                hostTool: input.hostTool.definition,
                actionContext: (_e = input.actionContext) !== null && _e !== void 0 ? _e : null,
                actionRunId: input.actionRunId,
                actionKey: input.actionKey,
                budgetHints: { callKind: 'decision' },
                signal: input.signal,
            });
            if (produced.llmInvoked) {
                llmCallCount += 1;
            }
            model = produced.model;
            promptTokens = produced.promptTokens;
            completionTokens = produced.completionTokens;
            if (produced.ok === false) {
                toolCallPrimaryFailed = true;
                allowStreamParseFallback = produced.retryWithStreamParse;
                recorder === null || recorder === void 0 ? void 0 : recorder.recordLlm(endName, {
                    model,
                    appendCount: 0,
                    sessionFillTextLen: 0,
                    producePath: 'tool_call',
                    delivery: contract.delivery,
                    dslDispatch: false,
                    toolCallFailed: true,
                    error: produced.error,
                    retryWithStreamParse: produced.retryWithStreamParse,
                    promptTokens,
                    completionTokens,
                });
                recorder === null || recorder === void 0 ? void 0 : recorder.record({
                    type: 'dsl',
                    name: 'produce.tool_call_failed',
                    status: 'failed',
                    detail: {
                        delivery: 'instant',
                        error: produced.error,
                        fallback: produced.retryWithStreamParse
                            ? 'stream_parse'
                            : 'none',
                    },
                });
                if (!produced.retryWithStreamParse) {
                    return {
                        fillText: '',
                        displayText: '',
                        dslOutcome: 'failed',
                        model,
                        promptTokens,
                        completionTokens,
                        appendCount: 0,
                        llmCallCount,
                        streamable: false,
                        delivery: contract.delivery,
                    };
                }
            }
            else {
                fillText = JSON.stringify(produced.args);
                displayText = (0, host_tool_args_from_llm_util_1.buildHostToolArgsDisplayText)(produced.args);
                (_f = input.onLlmDelta) === null || _f === void 0 ? void 0 : _f.call(input, { contentDelta: displayText, done: true });
                const droppedKeys = Object.keys((_g = produced.droppedCatalogIds) !== null && _g !== void 0 ? _g : {});
                recorder === null || recorder === void 0 ? void 0 : recorder.recordLlm(endName, Object.assign({ model, appendCount: 0, sessionFillTextLen: fillText.length, producePath: 'tool_call', delivery: contract.delivery, dslDispatch: true, promptTokens,
                    completionTokens }, (droppedKeys.length > 0
                    ? { droppedCatalogIds: produced.droppedCatalogIds }
                    : {})));
                if (droppedKeys.length > 0) {
                    recorder === null || recorder === void 0 ? void 0 : recorder.record({
                        type: 'dsl',
                        name: 'args.catalog_sanitized',
                        status: 'ok',
                        detail: {
                            delivery: 'instant',
                            droppedCatalogIds: produced.droppedCatalogIds,
                        },
                    });
                }
                dispatchInstantArgs({
                    publish,
                    actionRunId: input.actionRunId,
                    pageContext: input.pageContext,
                    generation: input.generation,
                    streamId: input.streamId,
                    reason: input.reason,
                    toolName,
                    args: produced.args,
                });
                dslOutcome = 'dispatched';
                recorder === null || recorder === void 0 ? void 0 : recorder.record({
                    type: 'dsl',
                    name: 'instant.dispatched',
                    status: 'ok',
                    detail: {
                        delivery: 'instant',
                        producePath: 'tool_call',
                        tool: toolName,
                        argKeys: Object.keys(produced.args),
                    },
                });
                return {
                    fillText,
                    displayText: displayText || fillText,
                    dslOutcome,
                    model,
                    promptTokens,
                    completionTokens,
                    appendCount: 0,
                    llmCallCount,
                    streamable: false,
                    delivery: contract.delivery,
                };
            }
        }
        catch (error) {
            if ((0, page_action_structured_produce_util_1.isLlmAbortError)(error, input.signal)) {
                throw error;
            }
            toolCallPrimaryFailed = true;
            allowStreamParseFallback = true;
            if (llmCallCount === 0) {
                llmCallCount += 1;
            }
            const message = error instanceof Error ? error.message : String(error);
            recorder === null || recorder === void 0 ? void 0 : recorder.recordLlm(endName, {
                model,
                appendCount: 0,
                sessionFillTextLen: 0,
                producePath: 'tool_call',
                delivery: contract.delivery,
                dslDispatch: false,
                toolCallFailed: true,
                error: message,
                retryWithStreamParse: true,
                promptTokens,
                completionTokens,
            });
            recorder === null || recorder === void 0 ? void 0 : recorder.record({
                type: 'dsl',
                name: 'produce.tool_call_failed',
                status: 'failed',
                detail: {
                    delivery: 'instant',
                    error: message,
                    fallback: 'stream_parse',
                },
            });
        }
    }
    if ((_h = input.signal) === null || _h === void 0 ? void 0 : _h.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError');
    }
    const isStreamParseFallback = toolCallPrimaryFailed && allowStreamParseFallback;
    if (fillStreamLive) {
        streamSession = new host_tool_stream_session_util_1.HostToolStreamSession({
            publish,
            sessionId: `page-action:${input.actionRunId}`,
            pageContext: (_j = input.pageContext) !== null && _j !== void 0 ? _j : {},
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
    const llmMessages = isStreamParseFallback
        ? withJsonArgsFallbackMessages(input.messages, input.hostTool.definition.name)
        : input.messages;
    const streamStartName = isStreamParseFallback
        ? resolveFallbackAuditStartName(startName)
        : startName;
    const streamEndName = isStreamParseFallback
        ? resolveFallbackAuditEndName(endName)
        : endName;
    recorder === null || recorder === void 0 ? void 0 : recorder.recordLlm(streamStartName, {
        messageCount: llmMessages.length,
        delivery: contract.delivery,
        produceMode: contract.produceMode,
        producePath: isStreamParseFallback ? 'stream_parse_fallback' : 'stream',
        streamableTools: fillTools.map((tool) => tool.name),
        dslDispatch: willDispatchLive,
    });
    (0, page_action_run_debug_util_1.logPageActionLlmPrompt)({
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        phase: isStreamParseFallback ? 'stream_parse_fallback' : 'stream',
        messages: llmMessages,
        meta: {
            delivery: contract.delivery,
            produceMode: contract.produceMode,
            willDispatchLive,
            fillStreamLive,
        },
    });
    try {
        const llmFill = await (0, plan_reason_host_machine_layer_util_1.runHostFillLlmStream)({
            llmService: input.llmService,
            messages: llmMessages,
            textSession,
            signal: input.signal,
            budgetHints: isStreamParseFallback
                ? { callKind: 'summarize' }
                : ((_k = input.budgetHints) !== null && _k !== void 0 ? _k : { callKind: 'summarize' }),
            onLlmDelta: (delta) => {
                var _a;
                (_a = input.onLlmDelta) === null || _a === void 0 ? void 0 : _a.call(input, delta);
            },
        });
        llmCallCount += 1;
        model = (_l = llmFill.model) !== null && _l !== void 0 ? _l : model;
        fillText = llmFill.fillText;
        displayText = llmFill.fillText;
        appendCount = llmFill.appendCount;
        const responseMeta = responseMetaFromStreamRaw(llmFill.streamResult.raw);
        const usage = (0, llm_response_meta_util_1.extractLlmTokenUsageFromResponseMeta)(responseMeta);
        promptTokens = addNullableTokenCounts(promptTokens, (_m = usage === null || usage === void 0 ? void 0 : usage.promptTokens) !== null && _m !== void 0 ? _m : null);
        completionTokens = addNullableTokenCounts(completionTokens, (_o = usage === null || usage === void 0 ? void 0 : usage.completionTokens) !== null && _o !== void 0 ? _o : null);
        if (!model) {
            model = (0, llm_response_meta_util_1.resolveLlmModelNameFromResponseMeta)(responseMeta);
        }
        (0, page_action_run_debug_util_1.logPageActionLlmResponse)({
            actionRunId: input.actionRunId,
            actionKey: input.actionKey,
            phase: isStreamParseFallback ? 'stream_parse_fallback' : 'stream',
            model,
            promptTokens,
            completionTokens,
            detail: {
                appendCount,
                fillText,
                rawAccumulatedText: llmFill.rawAccumulatedText,
                streamResultContent: (_p = llmFill.streamResult.content) !== null && _p !== void 0 ? _p : null,
                fellBackToInvoke: (_r = (_q = llmFill.streamResult.streamMeta) === null || _q === void 0 ? void 0 : _q.fellBackToInvoke) !== null && _r !== void 0 ? _r : false,
            },
        });
        recorder === null || recorder === void 0 ? void 0 : recorder.recordLlm(streamEndName, {
            model,
            appendCount,
            sessionFillTextLen: fillText.length,
            streamResultContentLen: (_t = (_s = llmFill.streamResult.content) === null || _s === void 0 ? void 0 : _s.length) !== null && _t !== void 0 ? _t : 0,
            rawAccumulatedLen: llmFill.rawAccumulatedLen,
            reconciledFromStreamResult: llmFill.reconciledFromStreamResult,
            fellBackToInvoke: (_v = (_u = llmFill.streamResult.streamMeta) === null || _u === void 0 ? void 0 : _u.fellBackToInvoke) !== null && _v !== void 0 ? _v : false,
            llmEmittedDeltaCount: (_x = (_w = llmFill.streamResult.streamMeta) === null || _w === void 0 ? void 0 : _w.emittedDeltaCount) !== null && _x !== void 0 ? _x : null,
            promptTokens,
            completionTokens,
            delivery: contract.delivery,
            producePath: isStreamParseFallback ? 'stream_parse_fallback' : 'stream',
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
                        streamResultContentLen: (_z = (_y = llmFill.streamResult.content) === null || _y === void 0 ? void 0 : _y.length) !== null && _z !== void 0 ? _z : 0,
                    },
                });
            }
        }
        else if (contract.delivery === 'instant') {
            const routedFromFull = (0, llm_stream_router_util_1.extractRoutedMessageFromLlmText)((_0 = llmFill.streamResult.content) !== null && _0 !== void 0 ? _0 : '');
            const parsed = (0, host_tool_args_from_llm_util_1.parseHostToolArgsFromLlmTextCandidates)({
                candidates: [
                    llmFill.rawAccumulatedText,
                    routedFromFull,
                    fillText,
                    llmFill.streamResult.content,
                ],
                argsSchema: input.hostTool.definition.argsSchema,
            });
            if (parsed.ok) {
                const sanitized = (0, host_tool_args_context_catalog_util_1.sanitizeHostToolArgsAgainstContextCatalogs)(parsed.args, input.hostTool.definition.argsSchema, (_1 = input.actionContext) !== null && _1 !== void 0 ? _1 : null);
                fillText = JSON.stringify(sanitized.args);
                displayText = (0, host_tool_args_from_llm_util_1.buildHostToolArgsDisplayText)(sanitized.args);
                if (Object.keys(sanitized.droppedByField).length > 0) {
                    recorder === null || recorder === void 0 ? void 0 : recorder.record({
                        type: 'dsl',
                        name: 'args.catalog_sanitized',
                        status: 'ok',
                        detail: {
                            delivery: 'instant',
                            producePath: isStreamParseFallback
                                ? 'stream_parse_fallback'
                                : 'stream_parse',
                            droppedCatalogIds: sanitized.droppedByField,
                        },
                    });
                }
                dispatchInstantArgs({
                    publish,
                    actionRunId: input.actionRunId,
                    pageContext: input.pageContext,
                    generation: input.generation,
                    streamId: input.streamId,
                    reason: input.reason,
                    toolName: input.hostTool.definition.name,
                    args: sanitized.args,
                });
                dslOutcome = 'dispatched';
                recorder === null || recorder === void 0 ? void 0 : recorder.record({
                    type: 'dsl',
                    name: 'instant.dispatched',
                    status: 'ok',
                    detail: {
                        delivery: 'instant',
                        producePath: isStreamParseFallback
                            ? 'stream_parse_fallback'
                            : 'stream_parse',
                        tool: input.hostTool.definition.name,
                        argKeys: Object.keys(sanitized.args),
                    },
                });
            }
            else {
                dslOutcome = 'failed';
                const failReason = parsed.ok === false ? parsed.reason : 'parse_failed';
                const failPreview = parsed.ok === false ? parsed.preview : '';
                recorder === null || recorder === void 0 ? void 0 : recorder.record({
                    type: 'dsl',
                    name: 'instant.failed',
                    status: 'failed',
                    detail: {
                        reason: failReason,
                        delivery: 'instant',
                        preview: failPreview,
                        rawAccumulatedLen: llmFill.rawAccumulatedLen,
                        streamResultContentLen: (_3 = (_2 = llmFill.streamResult.content) === null || _2 === void 0 ? void 0 : _2.length) !== null && _3 !== void 0 ? _3 : 0,
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
        llmCallCount,
        streamable: contract.delivery === 'fill_stream',
        delivery: contract.delivery,
    };
}
exports.executePageActionLlmDslStream = executePageActionLlmDslStream;
//# sourceMappingURL=page-action-llm-dsl-stream.util.js.map