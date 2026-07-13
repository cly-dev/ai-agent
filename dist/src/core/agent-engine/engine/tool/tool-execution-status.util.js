"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readRetryBackoffMs = exports.shouldReturnToLlmAfterToolErrors = exports.pickSummarizeErrorObservation = exports.shouldShortCircuitEmptyToSummarize = exports.hasIncompleteToolInvocation = exports.toolArgsHaveTemporalScope = exports.userMessageHasTemporalScope = exports.findLastErrorObservation = exports.resolveToolObservationOutputForStore = exports.resolveToolStepMachineCode = exports.resolveToolExecutionStatusAfterInvoke = exports.classifyToolExecutionStatus = exports.isMutationExecutionContext = exports.resolveToolErrorDisposition = exports.finalizeToolErrorDispositionAfterInvoke = exports.isMutationTool = exports.readToolInvokeMaxRetries = void 0;
const tool_agent_metadata_util_1 = require("../../../tool-engine/tool-agent-metadata.util");
const tool_mutation_util_1 = require("../../../tool-engine/tool-mutation.util");
const tool_agent_metadata_types_1 = require("../../../tool-engine/tool-agent-metadata.types");
const tool_pagination_params_util_1 = require("../../../tool-engine/tool-pagination-params.util");
const agent_run_user_messages_util_1 = require("../agent-run-user-messages.util");
const tool_observation_util_1 = require("./tool-observation.util");
const TEMPORAL_USER_HINT_RE = /近\s*\d+\s*天|最\s*近\s*\d+|last\s+\d+\s+days?|past\s+\d+\s+days?|时间范围|日期范围|startdate|enddate/i;
const TEMPORAL_ARG_KEY_RE = /date|time|day|start|end|from|to|period|range|created|updated/i;
function isMissingParamValue(value) {
    return value === undefined || value === null || value === '';
}
function errorTextFromOutput(output) {
    if ((0, agent_run_user_messages_util_1.isAgentToolErrorObservation)(output)) {
        return `${output.detail} ${output.userHint}`.toLowerCase();
    }
    if (output instanceof Error) {
        return output.message.toLowerCase();
    }
    return String(output).toLowerCase();
}
function extractRequiredParamNames(inputSchema) {
    if (!inputSchema || typeof inputSchema !== 'object' || Array.isArray(inputSchema)) {
        return [];
    }
    const params = inputSchema.parameters;
    if (!Array.isArray(params)) {
        return [];
    }
    return params
        .map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            return null;
        }
        const row = item;
        if (row.required !== true) {
            return null;
        }
        const name = row.name;
        return typeof name === 'string' && name.trim() ? name.trim() : null;
    })
        .filter((name) => name != null);
}
function readToolInvokeMaxRetries() {
    var _a;
    const raw = (_a = process.env.TOOL_INVOKE_MAX_RETRIES) === null || _a === void 0 ? void 0 : _a.trim();
    const value = raw ? Number.parseInt(raw, 10) : 2;
    return Number.isFinite(value) && value >= 0 ? value : 2;
}
exports.readToolInvokeMaxRetries = readToolInvokeMaxRetries;
var tool_mutation_util_2 = require("../../../tool-engine/tool-mutation.util");
Object.defineProperty(exports, "isMutationTool", { enumerable: true, get: function () { return tool_mutation_util_2.isMutationTool; } });
function finalizeToolErrorDispositionAfterInvoke(disposition) {
    return disposition === 'retry' ? 'summarize' : disposition;
}
exports.finalizeToolErrorDispositionAfterInvoke = finalizeToolErrorDispositionAfterInvoke;
function resolveToolErrorDisposition(output) {
    var _a;
    if (!(0, agent_run_user_messages_util_1.isAgentToolErrorObservation)(output)) {
        return 'summarize';
    }
    const code = (_a = (0, agent_run_user_messages_util_1.extractToolErrorCode)(output)) !== null && _a !== void 0 ? _a : inferCodeFromErrorText(output);
    const lower = errorTextFromOutput(output);
    if (code === 'TOOL_AUTH_FAILED') {
        return 'summarize';
    }
    if (lower.includes('404') || lower.includes('not found')) {
        return 'llm';
    }
    if (lower.includes('failed: 400') || /\b400\b/.test(lower)) {
        return 'llm';
    }
    if (code === 'TOOL_TIMEOUT' ||
        lower.includes('429') ||
        lower.includes('502') ||
        lower.includes('503') ||
        lower.includes('504') ||
        lower.includes('econnreset') ||
        lower.includes('network')) {
        return 'retry';
    }
    return 'summarize';
}
exports.resolveToolErrorDisposition = resolveToolErrorDisposition;
function inferCodeFromErrorText(output) {
    return (0, agent_run_user_messages_util_1.extractToolErrorCode)(output);
}
function isMutationExecutionContext(context) {
    return (0, tool_mutation_util_1.isMutationTool)(context === null || context === void 0 ? void 0 : context.agentMetadata);
}
exports.isMutationExecutionContext = isMutationExecutionContext;
function classifyToolExecutionStatus(output, context) {
    if ((0, agent_run_user_messages_util_1.isAgentToolErrorObservation)(output)) {
        return 'ERROR';
    }
    if (isMutationExecutionContext(context)) {
        return 'SUCCESS';
    }
    if ((0, tool_observation_util_1.isEmptyListToolObservation)(output)) {
        return 'EMPTY';
    }
    return 'SUCCESS';
}
exports.classifyToolExecutionStatus = classifyToolExecutionStatus;
function resolveToolExecutionStatusAfterInvoke(rawOutput, projectedOutput, context) {
    if (classifyToolExecutionStatus(rawOutput, context) === 'ERROR') {
        return 'ERROR';
    }
    return classifyToolExecutionStatus(projectedOutput, context);
}
exports.resolveToolExecutionStatusAfterInvoke = resolveToolExecutionStatusAfterInvoke;
function resolveToolStepMachineCode(input) {
    if ((0, agent_run_user_messages_util_1.isAgentToolErrorObservation)(input.output)) {
        return (0, agent_run_user_messages_util_1.extractToolErrorCode)(input.output);
    }
    if ((0, tool_mutation_util_1.isMutationTool)(input.agentMetadata)) {
        return null;
    }
    if ((0, tool_observation_util_1.isEmptyListToolObservation)(input.output)) {
        return null;
    }
    if (input.quality === 'low') {
        return 'TOOL_EMPTY_RESULT';
    }
    return null;
}
exports.resolveToolStepMachineCode = resolveToolStepMachineCode;
function resolveToolObservationOutputForStore(rawOutput, projectedOutput) {
    if (classifyToolExecutionStatus(rawOutput) === 'ERROR') {
        return rawOutput;
    }
    return projectedOutput;
}
exports.resolveToolObservationOutputForStore = resolveToolObservationOutputForStore;
function findLastErrorObservation(observations, preferredIndices) {
    if (preferredIndices && preferredIndices.length > 0) {
        for (let index = preferredIndices.length - 1; index >= 0; index -= 1) {
            const row = observations[preferredIndices[index]];
            if (row && (0, agent_run_user_messages_util_1.isAgentToolErrorObservation)(row.output)) {
                return row;
            }
        }
    }
    for (let index = observations.length - 1; index >= 0; index -= 1) {
        const row = observations[index];
        if (row && (0, agent_run_user_messages_util_1.isAgentToolErrorObservation)(row.output)) {
            return row;
        }
    }
    return null;
}
exports.findLastErrorObservation = findLastErrorObservation;
function userMessageHasTemporalScope(userMessage) {
    return TEMPORAL_USER_HINT_RE.test(userMessage.trim());
}
exports.userMessageHasTemporalScope = userMessageHasTemporalScope;
function toolArgsHaveTemporalScope(args) {
    return Object.entries(args).some(([key, value]) => TEMPORAL_ARG_KEY_RE.test(key) && !isMissingParamValue(value));
}
exports.toolArgsHaveTemporalScope = toolArgsHaveTemporalScope;
function hasIncompleteToolInvocation(input) {
    const meta = (0, tool_agent_metadata_util_1.parseAgentMetadata)(input.agentMetadata);
    const isListLike = (meta === null || meta === void 0 ? void 0 : meta.operation) === tool_agent_metadata_types_1.OperationType.LIST ||
        (meta === null || meta === void 0 ? void 0 : meta.operation) === tool_agent_metadata_types_1.OperationType.SEARCH ||
        (meta === null || meta === void 0 ? void 0 : meta.operation) === tool_agent_metadata_types_1.OperationType.STATS;
    const requiredParams = extractRequiredParamNames(input.inputSchema);
    for (const name of requiredParams) {
        if ((0, tool_pagination_params_util_1.isPaginationParam)(name)) {
            continue;
        }
        if (isMissingParamValue(input.args[name])) {
            return true;
        }
    }
    if (isListLike &&
        userMessageHasTemporalScope(input.userMessage) &&
        !toolArgsHaveTemporalScope(input.args)) {
        return true;
    }
    return false;
}
exports.hasIncompleteToolInvocation = hasIncompleteToolInvocation;
function shouldShortCircuitEmptyToSummarize(input) {
    if (input.executionStatuses.length === 0) {
        return false;
    }
    if (input.executionStatuses.some((status) => status === 'ERROR')) {
        return false;
    }
    if (input.toolCalls.some((call) => {
        const tool = input.scopedTools.find((row) => row.name === call.name);
        return tool != null && (0, tool_mutation_util_1.isMutationTool)(tool.agentMetadata);
    })) {
        return false;
    }
    if (!input.executionStatuses.every((status) => status === 'EMPTY')) {
        return false;
    }
    for (const call of input.toolCalls) {
        const tool = input.scopedTools.find((row) => row.name === call.name);
        if (!tool) {
            continue;
        }
        if (hasIncompleteToolInvocation({
            userMessage: input.userMessage,
            agentMetadata: tool.agentMetadata,
            inputSchema: tool.inputSchema,
            args: call.arguments,
        })) {
            return false;
        }
    }
    return true;
}
exports.shouldShortCircuitEmptyToSummarize = shouldShortCircuitEmptyToSummarize;
function pickSummarizeErrorObservation(observations, dispositions, roundObservationIndices) {
    for (let roundIndex = 0; roundIndex < roundObservationIndices.length; roundIndex += 1) {
        const observationIndex = roundObservationIndices[roundIndex];
        const row = observations[observationIndex];
        if (!row) {
            continue;
        }
        if ((0, agent_run_user_messages_util_1.isAgentToolErrorObservation)(row.output) &&
            dispositions[roundIndex] === 'summarize') {
            return row;
        }
    }
    return null;
}
exports.pickSummarizeErrorObservation = pickSummarizeErrorObservation;
function shouldReturnToLlmAfterToolErrors(observations, dispositions, roundObservationIndices) {
    let sawError = false;
    for (let roundIndex = 0; roundIndex < roundObservationIndices.length; roundIndex += 1) {
        const observationIndex = roundObservationIndices[roundIndex];
        const row = observations[observationIndex];
        if (!row || !(0, agent_run_user_messages_util_1.isAgentToolErrorObservation)(row.output)) {
            continue;
        }
        sawError = true;
        if (dispositions[roundIndex] === 'summarize') {
            return false;
        }
    }
    return sawError;
}
exports.shouldReturnToLlmAfterToolErrors = shouldReturnToLlmAfterToolErrors;
function readRetryBackoffMs(attempt) {
    const base = 400;
    return base * attempt;
}
exports.readRetryBackoffMs = readRetryBackoffMs;
//# sourceMappingURL=tool-execution-status.util.js.map