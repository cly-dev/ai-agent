"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPlanReasonHostMachineContext = exports.runPlanReasonHostMachineLayer = exports.runHostFillLlmStream = exports.createPlanReasonHostFillStreamTextSession = exports.buildPlanHostFillsFromMachineText = exports.sanitizeMachineFillText = void 0;
const llm_output_sanitize_util_1 = require("../../llm-output-sanitize.util");
const llm_stream_router_util_1 = require("../../llm-stream-router.util");
const host_tool_stream_observation_util_1 = require("../../../../host-bridge/host-tool-stream-observation.util");
const host_tool_stream_session_util_1 = require("../../../../host-bridge/host-tool-stream-session.util");
const host_tool_stream_target_util_1 = require("../../../../host-bridge/host-tool-stream-target.util");
const llm_prompt_debug_util_1 = require("../../llm-prompt-debug.util");
const host_tool_plan_util_1 = require("../host-tool/host-tool-plan.util");
const plan_reason_host_machine_prompt_util_1 = require("./plan-reason-host-machine-prompt.util");
function sanitizeMachineFillText(raw) {
    let text = raw.trim();
    if (!text) {
        return '';
    }
    const fenced = text.match(/^```(?:text)?\s*([\s\S]*?)```$/i);
    if (fenced === null || fenced === void 0 ? void 0 : fenced[1]) {
        text = fenced[1].trim();
    }
    return (0, llm_output_sanitize_util_1.sanitizeLlmFinalOutput)((0, llm_output_sanitize_util_1.sanitizeTextForStorage)(text)).trim();
}
exports.sanitizeMachineFillText = sanitizeMachineFillText;
function nextSanitizedMachineFillDelta(rawSnapshot, previouslyEmitted) {
    const sanitized = sanitizeMachineFillText(rawSnapshot);
    if (!sanitized) {
        return { delta: '', emitted: previouslyEmitted };
    }
    if (sanitized.startsWith(previouslyEmitted)) {
        return {
            delta: sanitized.slice(previouslyEmitted.length),
            emitted: sanitized,
        };
    }
    return { delta: '', emitted: previouslyEmitted };
}
function buildPlanHostFillsFromMachineText(input) {
    const fillText = sanitizeMachineFillText(input.text);
    if (!fillText) {
        return [];
    }
    const fills = [];
    for (const tool of input.fillTools) {
        if (!input.allowedToolNames.has(tool.name)) {
            continue;
        }
        fills.push({
            tool: tool.name,
            arguments: {
                [tool.streamablePath]: fillText,
            },
        });
    }
    return fills;
}
exports.buildPlanHostFillsFromMachineText = buildPlanHostFillsFromMachineText;
function createPlanReasonHostFillStreamTextSession(callbacks) {
    let accumulatedRaw = '';
    let sanitizedEmitted = '';
    let appendCount = 0;
    let routedMessageChars = 0;
    let routerState = (0, llm_stream_router_util_1.createLlmStreamRouterState)();
    const ingestRoutedMessage = (messageDelta) => {
        var _a;
        if (!messageDelta) {
            return;
        }
        routedMessageChars += messageDelta.length;
        accumulatedRaw += messageDelta;
        const next = nextSanitizedMachineFillDelta(accumulatedRaw, sanitizedEmitted);
        sanitizedEmitted = next.emitted;
        if (!next.delta) {
            return;
        }
        appendCount += 1;
        (_a = callbacks.onSanitizedDelta) === null || _a === void 0 ? void 0 : _a.call(callbacks, next.delta);
    };
    return {
        ingestLlmDelta(delta) {
            if (!delta) {
                return;
            }
            const routed = (0, llm_stream_router_util_1.routeLlmStreamChunk)(routerState, delta);
            routerState = routed.state;
            ingestRoutedMessage(routed.message);
        },
        reconcileStreamResult(fullContent) {
            const trimmed = fullContent.trim();
            if (!trimmed || accumulatedRaw.trim()) {
                return false;
            }
            const message = (0, llm_stream_router_util_1.extractRoutedMessageFromLlmText)(trimmed);
            if (!message.trim()) {
                return false;
            }
            ingestRoutedMessage(message);
            return true;
        },
        resolveFillText() {
            return sanitizeMachineFillText(accumulatedRaw) || sanitizedEmitted;
        },
        getRawAccumulatedLength() {
            return accumulatedRaw.length;
        },
        getRawAccumulatedText() {
            return accumulatedRaw;
        },
        get appendCount() {
            return appendCount;
        },
        get routedMessageChars() {
            return routedMessageChars;
        },
    };
}
exports.createPlanReasonHostFillStreamTextSession = createPlanReasonHostFillStreamTextSession;
async function runHostFillLlmStream(input) {
    let model = null;
    const streamResult = await input.llmService.streamChat(Object.assign({ messages: input.messages, tools: [], signal: input.signal }, (input.budgetHints ? { budgetHints: input.budgetHints } : {})), {
        signal: input.signal,
        onDelta: (delta) => {
            var _a;
            (_a = input.onLlmDelta) === null || _a === void 0 ? void 0 : _a.call(input, {
                contentDelta: delta.contentDelta,
                model: delta.model,
                done: delta.done,
            });
            if (delta.contentDelta) {
                input.textSession.ingestLlmDelta(delta.contentDelta);
            }
            if (delta.model) {
                model = delta.model;
            }
        },
    });
    if (streamResult.model) {
        model = streamResult.model;
    }
    const reconciledFromStreamResult = input.textSession.reconcileStreamResult(streamResult.content);
    const fillText = input.textSession.resolveFillText();
    return {
        model,
        streamResult,
        fillText,
        appendCount: input.textSession.appendCount,
        routedMessageChars: input.textSession.routedMessageChars,
        rawAccumulatedLen: input.textSession.getRawAccumulatedLength(),
        reconciledFromStreamResult,
    };
}
exports.runHostFillLlmStream = runHostFillLlmStream;
function toHostToolInvocations(fills) {
    return fills.map((fill) => ({
        name: fill.tool,
        args: fill.arguments,
    }));
}
function toDslContext(context) {
    var _a;
    return Object.assign(Object.assign({}, context), { pageContext: (_a = context.pageContext) !== null && _a !== void 0 ? _a : {} });
}
function resolveDelivery(deps, context, fillTools) {
    return (0, host_tool_stream_target_util_1.resolvePlanReasonHostStreamDelivery)({
        hostStepId: context.hostStepId,
        fillTools,
        runId: context.runId,
        turnId: context.turnId,
        reasonStepId: context.reasonStepId,
        canPublishRun: deps.runSseGateway.canPublishRun(context.sessionId, context.runId),
    });
}
async function runMachineStreamLlm(input) {
    const messages = await (0, plan_reason_host_machine_prompt_util_1.buildPlanReasonHostMachineStreamMessages)({
        agentPrompts: input.context.agentPrompts,
        promptRegistry: input.deps.promptRegistry,
        scope: input.context.scope,
        userContext: input.context.userContext,
    });
    (0, llm_prompt_debug_util_1.emitLlmPromptDebug)((message) => input.deps.logger.log(message), {
        runId: input.context.runId,
        sessionId: input.context.sessionId,
        phase: 'summarize',
        messages,
        meta: { planReasonHostFillStream: true },
    });
    try {
        const llmResult = await runHostFillLlmStream({
            llmService: input.deps.llmService,
            messages,
            textSession: input.textSession,
            signal: input.signal,
            budgetHints: {
                callKind: 'summarize',
                sessionId: input.context.sessionId,
                runId: input.context.runId,
                phase: 'summarize',
            },
        });
        void llmResult;
        return 'completed';
    }
    catch (error) {
        input.deps.logger.warn(`plan reason host fill stream llm failed: ${error instanceof Error ? error.message : String(error)} runId=${input.context.runId}`);
        return 'failed';
    }
}
function createHostToolStreamSession(deps, context, streamTarget) {
    var _a;
    const generation = (_a = deps.runSseGateway.getBoundRunGeneration(context.sessionId, context.runId)) !== null && _a !== void 0 ? _a : undefined;
    return new host_tool_stream_session_util_1.HostToolStreamSession({
        publish: (sid, envelope) => {
            deps.runSseGateway.emitHostAction(sid, context.runId, envelope.payload);
        },
        sessionId: context.sessionId,
        pageContext: context.pageContext,
        runId: context.runId,
        turnId: context.turnId,
        hostStepId: streamTarget.hostStepId,
        reason: streamTarget.reason,
        generation,
    });
}
function buildStreamObservation(input) {
    const primary = (0, host_tool_stream_target_util_1.primaryHostToolStreamTool)(input.streamTarget);
    return (0, host_tool_stream_observation_util_1.buildHostToolStreamObservation)({
        outcome: input.outcome,
        hostStepId: input.streamTarget.hostStepId,
        streamId: input.streamTarget.streamId,
        hostTools: input.hostTools,
        streamablePath: primary.streamablePath,
    });
}
async function produceMachineLayerFills(input) {
    const textSession = createPlanReasonHostFillStreamTextSession({
        onSanitizedDelta: input.onSanitizedDelta,
    });
    const llmStatus = await runMachineStreamLlm({
        deps: input.deps,
        context: input.context,
        textSession,
        signal: input.signal,
    });
    const fills = buildPlanHostFillsFromMachineText({
        text: textSession.resolveFillText(),
        fillTools: input.fillTools,
        allowedToolNames: input.context.allowedToolNames,
    });
    return {
        fills,
        llmStatus,
        appendCount: textSession.appendCount,
    };
}
async function runPlanReasonHostMachineLayerStream(deps, context, streamTarget) {
    var _a;
    const dslContext = toDslContext(context);
    const abortSignal = (_a = deps.runSseGateway.getRunAbortSignal(context.sessionId, context.runId)) !== null && _a !== void 0 ? _a : undefined;
    const streamSession = createHostToolStreamSession(deps, dslContext, streamTarget);
    streamSession.begin({
        streamId: streamTarget.streamId,
        tools: streamTarget.tools,
        reason: streamTarget.reason,
    });
    const produced = await produceMachineLayerFills({
        deps,
        context,
        fillTools: streamTarget.tools,
        onSanitizedDelta: (delta) => streamSession.appendFillChunk(delta),
        signal: abortSignal,
    });
    if (produced.fills.length > 0) {
        const hostToolsPayload = toHostToolInvocations(produced.fills);
        streamSession.finalize({
            hostTools: hostToolsPayload,
            reason: streamTarget.reason,
        });
        deps.logger.log(`plan reason host fill stream finalized runId=${context.runId} streamId=${streamTarget.streamId} tools=${hostToolsPayload.map((row) => row.name).join(',')}`);
        return {
            fills: produced.fills,
            delivery: 'stream',
            dslOutcome: 'dispatched',
            hostToolStreamObservation: buildStreamObservation({
                outcome: 'dispatched',
                streamTarget,
                hostTools: hostToolsPayload,
            }),
            hostToolDispatchObservations: (0, host_tool_plan_util_1.buildHostToolDispatchObservations)({
                hostCalls: hostToolsPayload.map((row) => ({
                    name: row.name,
                    arguments: row.args,
                })),
                planStepId: streamTarget.hostStepId,
            }),
        };
    }
    streamSession.abort({ emitSessionEnd: streamSession.hasBegun });
    deps.logger.warn(`plan reason host fill stream failed runId=${context.runId} streamId=${streamTarget.streamId} llm=${produced.llmStatus} appends=${produced.appendCount}`);
    return {
        fills: [],
        delivery: 'stream',
        dslOutcome: 'failed',
        hostToolStreamObservation: buildStreamObservation({
            outcome: 'failed',
            streamTarget,
            hostTools: [],
        }),
    };
}
async function runPlanReasonHostMachineLayerObservation(deps, context, fillTools) {
    var _a;
    const abortSignal = (_a = deps.runSseGateway.getRunAbortSignal(context.sessionId, context.runId)) !== null && _a !== void 0 ? _a : undefined;
    const produced = await produceMachineLayerFills({
        deps,
        context,
        fillTools,
        signal: abortSignal,
    });
    if (produced.fills.length === 0) {
        deps.logger.warn(`plan reason host fill observation-only empty runId=${context.runId} llm=${produced.llmStatus}`);
    }
    return {
        fills: produced.fills,
        delivery: 'observation',
    };
}
async function runPlanReasonHostMachineLayer(deps, context) {
    const fillTools = (0, host_tool_stream_target_util_1.resolvePlanReasonHostFillTools)({
        hostTools: context.hostTools,
        allowedToolNames: context.allowedToolNames,
    });
    if (fillTools.length === 0) {
        deps.logger.warn(`plan reason host fill skipped: no streamable host tool fields runId=${context.runId}`);
        return { fills: [], delivery: 'observation' };
    }
    const delivery = resolveDelivery(deps, context, fillTools);
    if (delivery.mode === 'stream') {
        return runPlanReasonHostMachineLayerStream(deps, context, delivery.target);
    }
    return runPlanReasonHostMachineLayerObservation(deps, context, fillTools);
}
exports.runPlanReasonHostMachineLayer = runPlanReasonHostMachineLayer;
function buildPlanReasonHostMachineContext(input) {
    return {
        agentPrompts: input.agentPrompts,
        userContext: (0, plan_reason_host_machine_prompt_util_1.buildPlanReasonHostFillUserContent)({
            userMessage: input.userMessage,
            planContext: input.planContext,
            pageContext: input.pageContext,
            hostTools: input.hostTools,
            splitObservationsText: input.splitObservationsText,
            serializedOutput: input.serializedOutput,
        }),
        allowedToolNames: input.allowedToolNames,
        hostTools: input.hostTools,
        pageContext: input.pageContext,
        sessionId: input.sessionId,
        runId: input.runId,
        turnId: input.turnId,
        scope: input.scope,
        hostStepId: input.hostStepId,
        reasonStepId: input.reasonStepId,
    };
}
exports.buildPlanReasonHostMachineContext = buildPlanReasonHostMachineContext;
//# sourceMappingURL=plan-reason-host-machine-layer.util.js.map