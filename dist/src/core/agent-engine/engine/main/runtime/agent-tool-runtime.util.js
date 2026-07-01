"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executePendingWriteToolCalls = exports.executeToolCallsRound = exports.invokeToolWithRetry = exports.buildEngineToolsFromAllowed = void 0;
const observation_format_util_1 = require("../../observation-format.util");
const tool_output_projection_util_1 = require("../../../../tool-engine/tool-output-projection.util");
const agent_run_user_messages_util_1 = require("../../agent-run-user-messages.util");
const run_metrics_util_1 = require("../../run-metrics.util");
const tool_execution_status_util_1 = require("../../tool/tool-execution-status.util");
const tool_http_request_layout_util_1 = require("../../../../tool-engine/tool-http-request-layout.util");
const tool_response_source_util_1 = require("../../../../tool-engine/tool-response-source.util");
const tool_input_sanitize_util_1 = require("../../../../tool-engine/tool-input-sanitize.util");
const tool_execution_debug_util_1 = require("../../tool/tool-execution-debug.util");
const agent_run_steps_util_1 = require("../run/agent-run-steps.util");
function buildEngineToolsFromAllowed(allowedTools, userId, toolEngine) {
    const tools = allowedTools.map((tool) => {
        var _a;
        return ({
            id: tool.id,
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            schema: tool.schema,
            method: tool.method,
            path: tool.path,
            timeout: tool.timeout,
            integration: {
                id: tool.integration.id,
                name: tool.integration.name,
                baseUrl: tool.integration.baseUrl,
                authMode: tool.integration.authMode,
                apiKey: tool.integration.apiKey,
            },
            toolCategoryId: (_a = tool.toolCategoryId) !== null && _a !== void 0 ? _a : null,
            riskLevel: tool.riskLevel,
            responseProfile: tool.responseProfile,
            agentMetadata: tool.agentMetadata,
        });
    });
    const toolProfilesByName = Object.fromEntries(tools.map((tool) => [
        tool.name,
        (0, tool_output_projection_util_1.parseResponseProfile)(tool.responseProfile),
    ]));
    const allowedToolIds = tools.map((tool) => tool.id);
    const toolBuildCtx = {
        userId,
        allowedToolIds,
    };
    const langChainTools = toolEngine.buildLangChainTools(tools, toolBuildCtx);
    return {
        tools,
        toolProfilesByName,
        allowedToolIds,
        langChainTools,
        toolBuildCtx,
    };
}
exports.buildEngineToolsFromAllowed = buildEngineToolsFromAllowed;
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
function resolveOpenApiParameterSpecs(def) {
    const fromInput = (0, tool_input_sanitize_util_1.collectOpenApiParameterSpecs)(def.inputSchema);
    if (fromInput.length > 0) {
        return fromInput;
    }
    return (0, tool_input_sanitize_util_1.collectOpenApiParameterSpecs)(def.schema);
}
function prepareLangChainToolInput(def, input) {
    if (!def) {
        return input;
    }
    const specs = resolveOpenApiParameterSpecs(def);
    if (specs.length === 0) {
        return input;
    }
    const withDefaults = (0, tool_input_sanitize_util_1.applyToolParameterDefaults)(input, specs, {
        agentMetadata: def.agentMetadata,
        responseProfile: def.responseProfile,
    });
    return (0, tool_input_sanitize_util_1.sanitizeToolInvokeInput)(withDefaults, specs);
}
async function invokeToolOnce(toolEngine, bundle, scopedTools, toolCall) {
    var _a;
    const startedAt = Date.now();
    const def = scopedTools.find((tool) => tool.name === toolCall.name);
    const invokeInput = prepareLangChainToolInput(def, toolCall.arguments);
    try {
        return await toolEngine.invokeLangChainTool(bundle, toolCall.name, invokeInput);
    }
    catch (error) {
        return {
            toolId: (_a = def === null || def === void 0 ? void 0 : def.id) !== null && _a !== void 0 ? _a : 0,
            name: toolCall.name,
            input: invokeInput,
            output: (0, agent_run_user_messages_util_1.buildToolErrorObservation)(error, {
                isMutation: def ? (0, tool_execution_status_util_1.isMutationTool)(def.agentMetadata) : false,
            }),
            latency: Date.now() - startedAt,
            responseSource: (0, tool_response_source_util_1.extractRawInvokeError)(error),
            httpResponse: error instanceof tool_response_source_util_1.ToolHttpResponseError
                ? error.httpResponse
                : undefined,
        };
    }
}
async function invokeToolWithRetry(toolEngine, bundle, scopedTools, toolCall) {
    var _a;
    const def = scopedTools.find((tool) => tool.name === toolCall.name);
    const maxRetries = (0, tool_execution_status_util_1.readToolInvokeMaxRetries)();
    const maxAttempts = maxRetries + 1;
    const skipRetry = def ? (0, tool_execution_status_util_1.isMutationTool)(def.agentMetadata) : false;
    let lastResult = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        lastResult = await invokeToolOnce(toolEngine, bundle, scopedTools, toolCall);
        const executionStatus = (0, tool_execution_status_util_1.classifyToolExecutionStatus)(lastResult.output, {
            agentMetadata: def === null || def === void 0 ? void 0 : def.agentMetadata,
        });
        if (executionStatus !== 'ERROR') {
            return Object.assign(Object.assign({}, lastResult), { attempts: attempt, executionStatus });
        }
        const errorDisposition = (0, tool_execution_status_util_1.resolveToolErrorDisposition)(lastResult.output);
        const canRetry = !skipRetry &&
            errorDisposition === 'retry' &&
            attempt < maxAttempts;
        if (!canRetry) {
            return Object.assign(Object.assign({}, lastResult), { attempts: attempt, executionStatus: 'ERROR', errorDisposition: (0, tool_execution_status_util_1.finalizeToolErrorDispositionAfterInvoke)(errorDisposition) });
        }
        await sleep((0, tool_execution_status_util_1.readRetryBackoffMs)(attempt));
    }
    const fallback = lastResult !== null && lastResult !== void 0 ? lastResult : {
        toolId: (_a = def === null || def === void 0 ? void 0 : def.id) !== null && _a !== void 0 ? _a : 0,
        name: toolCall.name,
        input: toolCall.arguments,
        output: (0, agent_run_user_messages_util_1.buildToolErrorObservation)(new Error('tool invoke failed')),
        latency: 0,
    };
    return Object.assign(Object.assign({}, fallback), { attempts: maxAttempts, executionStatus: 'ERROR', errorDisposition: (0, tool_execution_status_util_1.finalizeToolErrorDispositionAfterInvoke)((0, tool_execution_status_util_1.resolveToolErrorDisposition)(fallback.output)) });
}
exports.invokeToolWithRetry = invokeToolWithRetry;
function resolveDefaultToolStepCode(quality, output, agentMetadata) {
    return (0, tool_execution_status_util_1.resolveToolStepMachineCode)({ quality, output, agentMetadata });
}
async function executeToolCallsRound(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (input.toolCalls.length === 0) {
        return {
            steps: input.steps,
            toolObservations: input.observations,
            lastToolRoundMeta: {
                toolCalls: [],
                executionStatuses: [],
                errorDispositions: [],
                roundObservationIndices: [],
            },
        };
    }
    const toolCalls = input.toolCalls;
    (_a = input.assertContinue) === null || _a === void 0 ? void 0 : _a.call(input);
    for (const toolCall of toolCalls) {
        (_b = input.onThink) === null || _b === void 0 ? void 0 : _b.call(input, `\n正在调用工具：${toolCall.name}\n`);
    }
    const toolResults = await Promise.all(toolCalls.map((toolCall) => invokeToolWithRetry(input.toolEngine, input.langChainBundle, input.scopedTools, toolCall)));
    const observations = [...input.observations];
    const steps = [...input.steps];
    const executionStatuses = [];
    const errorDispositions = [];
    const roundObservationIndices = [];
    const resolveToolStepCode = (_c = input.resolveToolStepCode) !== null && _c !== void 0 ? _c : resolveDefaultToolStepCode;
    for (let idx = 0; idx < toolResults.length; idx += 1) {
        const toolResult = toolResults[idx];
        const toolCall = toolCalls[idx];
        const toolDef = input.scopedTools.find((tool) => tool.name === toolResult.name);
        const profile = (_d = input.toolProfilesByName[toolResult.name]) !== null && _d !== void 0 ? _d : null;
        const statusContext = { agentMetadata: toolDef === null || toolDef === void 0 ? void 0 : toolDef.agentMetadata };
        const projected = (0, tool_output_projection_util_1.projectToolOutput)(toolResult.output, input.latestUserMessage, profile);
        const executionStatus = (0, tool_execution_status_util_1.resolveToolExecutionStatusAfterInvoke)(toolResult.output, projected.data, statusContext);
        executionStatuses.push(executionStatus);
        const rawErrorDisposition = executionStatus === 'ERROR'
            ? ((_e = toolResult.errorDisposition) !== null && _e !== void 0 ? _e : (0, tool_execution_status_util_1.resolveToolErrorDisposition)(toolResult.output))
            : 'llm';
        const errorDisposition = executionStatus === 'ERROR'
            ? (0, tool_execution_status_util_1.finalizeToolErrorDispositionAfterInvoke)(rawErrorDisposition)
            : 'llm';
        errorDispositions.push(errorDisposition);
        const observationOutput = (0, tool_execution_status_util_1.resolveToolObservationOutputForStore)(toolResult.output, projected.data);
        const llmPayload = (0, observation_format_util_1.formatObservationForLlm)({
            toolName: toolResult.name,
            output: observationOutput,
            fieldLabels: projected.fieldLabels,
            args: toolCall.arguments,
        });
        const nextObservation = {
            name: toolResult.name,
            output: observationOutput,
            llmPayload,
            quality: input.assessObservationQuality(observationOutput, toolDef === null || toolDef === void 0 ? void 0 : toolDef.agentMetadata),
            fieldLabels: projected.fieldLabels,
            fieldDescriptions: projected.fieldDescriptions,
            enumLabelsByPath: projected.enumLabelsByPath,
        };
        const duplicateObservationIndex = observations.findIndex((row) => row.llmPayload != null &&
            (0, observation_format_util_1.isSameObservationPayload)(row.llmPayload, llmPayload));
        let observationIndex;
        if (duplicateObservationIndex >= 0) {
            observations[duplicateObservationIndex] = nextObservation;
            observationIndex = duplicateObservationIndex;
        }
        else {
            observations.push(nextObservation);
            observationIndex = observations.length - 1;
        }
        roundObservationIndices.push(observationIndex);
        const quality = input.assessObservationQuality(observationOutput, toolDef === null || toolDef === void 0 ? void 0 : toolDef.agentMetadata);
        const toolCode = resolveToolStepCode(quality, observationOutput, toolDef === null || toolDef === void 0 ? void 0 : toolDef.agentMetadata);
        const executedInput = toolResult.input;
        const rawOutput = toolResult.output;
        const responseSource = (0, tool_response_source_util_1.resolveToolResponseSource)({ toolResult });
        const httpRequest = toolDef
            ? (0, tool_http_request_layout_util_1.buildToolHttpRequestLayout)({
                method: toolDef.method,
                path: toolDef.path,
                inputSchema: toolDef.inputSchema,
                schema: toolDef.schema,
                baseUrl: toolDef.integration.baseUrl,
            }, executedInput)
            : undefined;
        const toolStepNumber = (0, agent_run_steps_util_1.nextRunStepNumber)(steps);
        const debugFile = (0, tool_execution_debug_util_1.emitToolExecutionDebug)((_f = input.onToolDebugLog) !== null && _f !== void 0 ? _f : (() => { }), {
            runId: input.runId,
            sessionId: input.sessionId,
            toolName: toolResult.name,
            step: toolStepNumber,
            iteration: input.iteration,
            latencyMs: toolResult.latency,
            executionStatus,
            llmArguments: toolCall.arguments,
            executedInput,
            httpRequest,
            responseSource,
            rawOutput,
            observationOutput,
        });
        if (debugFile && input.onToolDebugLog) {
            input.onToolDebugLog(`Tool execution debug file runId=${(_g = input.runId) !== null && _g !== void 0 ? _g : '-'} tool=${toolResult.name} path=${debugFile}`);
        }
        steps.push({
            step: toolStepNumber,
            type: 'tool',
            name: toolResult.name,
            input: executedInput,
            output: (0, tool_execution_debug_util_1.serializeAgentRunStepPayload)(rawOutput),
            meta: {
                latency: toolResult.latency,
                quality,
                code: toolCode !== null && toolCode !== void 0 ? toolCode : undefined,
                executionStatus,
                attempt: toolResult.attempts,
                errorDisposition: executionStatus === 'ERROR' ? errorDisposition : undefined,
                llmArguments: toolCall.arguments,
                observationOutput: (0, tool_execution_debug_util_1.serializeAgentRunStepPayload)(observationOutput),
                httpRequest,
                responseSource,
            },
        });
        if (input.runMetrics) {
            (0, run_metrics_util_1.recordMachineCodeUsage)(input.runMetrics, toolCode);
            (0, run_metrics_util_1.recordToolUsage)(input.runMetrics, {
                name: toolResult.name,
                latencyMs: toolResult.latency,
                quality,
            });
        }
        const toolFailed = (0, agent_run_user_messages_util_1.isAgentToolErrorObservation)(toolResult.output);
        (_h = input.onThink) === null || _h === void 0 ? void 0 : _h.call(input, toolFailed
            ? `工具 ${toolCall.name} 未能返回可用数据\n`
            : `工具 ${toolCall.name} 调用完成\n`);
    }
    return {
        steps,
        toolObservations: observations,
        lastToolRoundMeta: {
            toolCalls: [...toolCalls],
            executionStatuses,
            errorDispositions,
            roundObservationIndices,
        },
    };
}
exports.executeToolCallsRound = executeToolCallsRound;
async function executePendingWriteToolCalls(input) {
    var _a, _b;
    const toolProfilesByName = Object.fromEntries(input.tools.map((tool) => [
        tool.name,
        (0, tool_output_projection_util_1.parseResponseProfile)(tool.responseProfile),
    ]));
    const pendingCalls = input.toolCalls.map((call) => ({
        name: call.name,
        arguments: call.arguments,
    }));
    const priorObservations = (_a = input.priorObservations) !== null && _a !== void 0 ? _a : [];
    const priorSteps = (_b = input.priorSteps) !== null && _b !== void 0 ? _b : [];
    const round = await executeToolCallsRound({
        latestUserMessage: input.latestUserMessage,
        toolCalls: pendingCalls,
        scopedTools: input.tools,
        toolProfilesByName,
        langChainBundle: input.langChainBundle,
        toolEngine: input.toolEngine,
        observations: priorObservations,
        steps: [...priorSteps],
        iteration: (0, agent_run_steps_util_1.maxRunStepNumber)(priorSteps),
        assessObservationQuality: input.assessObservationQuality,
        runId: input.runId,
        sessionId: input.sessionId,
        onToolDebugLog: input.onToolDebugLog,
        assertContinue: input.assertContinue,
    });
    const newObservations = round.toolObservations.slice(priorObservations.length);
    return {
        observations: newObservations,
        steps: round.steps,
        lastToolRoundMeta: round.lastToolRoundMeta,
    };
}
exports.executePendingWriteToolCalls = executePendingWriteToolCalls;
//# sourceMappingURL=agent-tool-runtime.util.js.map