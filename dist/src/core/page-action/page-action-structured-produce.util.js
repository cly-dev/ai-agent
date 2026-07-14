"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.produceHostToolArgsViaToolCall = exports.isLlmAbortError = void 0;
const decision_util_1 = require("../agent-engine/engine/main/agent-graph/runtime/decision.util");
const host_tool_args_context_catalog_util_1 = require("../host-bridge/host-tool-args-context-catalog.util");
const host_tool_args_from_llm_util_1 = require("../host-bridge/host-tool-args-from-llm.util");
const host_tool_langchain_util_1 = require("../host-bridge/host-tool-langchain.util");
const llm_response_meta_util_1 = require("../llm/llm-response-meta.util");
const page_action_run_debug_util_1 = require("./page-action-run-debug.util");
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function formatUnknownError(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
function isLlmAbortError(error, signal) {
    if (signal === null || signal === void 0 ? void 0 : signal.aborted) {
        return true;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
        return true;
    }
    if (error instanceof Error && error.name === 'AbortError') {
        return true;
    }
    return false;
}
exports.isLlmAbortError = isLlmAbortError;
async function produceHostToolArgsViaToolCall(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    let modelName = null;
    let promptTokens = null;
    let completionTokens = null;
    let didInvoke = false;
    try {
        if ((_a = input.signal) === null || _a === void 0 ? void 0 : _a.aborted) {
            throw new DOMException('The operation was aborted.', 'AbortError');
        }
        const { schema: schemaForBind, catalogEnumInjected } = (0, host_tool_args_context_catalog_util_1.resolveHostToolArgsSchemaForToolCallBind)(input.hostTool.argsSchema, (_b = input.actionContext) !== null && _b !== void 0 ? _b : null);
        const toolForBind = Object.assign(Object.assign({}, input.hostTool), { argsSchema: schemaForBind });
        let tools;
        let byName;
        try {
            const built = (0, host_tool_langchain_util_1.buildHostLangChainTools)([toolForBind]);
            tools = built.tools;
            byName = built.byName;
        }
        catch (error) {
            return {
                ok: false,
                error: `host_tool_bind_failed:${formatUnknownError(error)}`,
                model: modelName,
                promptTokens,
                completionTokens,
                llmInvoked: false,
                retryWithStreamParse: false,
            };
        }
        const lcTool = byName.get(input.hostTool.name);
        if (!lcTool || tools.length === 0) {
            return {
                ok: false,
                error: 'host_tool_bind_failed',
                model: modelName,
                promptTokens,
                completionTokens,
                llmInvoked: false,
                retryWithStreamParse: false,
            };
        }
        const { model, messages: fittedMessages } = await input.llmService.createLangChainChatModelForMessages(input.messages, {
            budgetHints: (_c = input.budgetHints) !== null && _c !== void 0 ? _c : { callKind: 'decision' },
        });
        if (input.actionRunId != null) {
            (0, page_action_run_debug_util_1.logPageActionLlmPrompt)({
                actionRunId: input.actionRunId,
                actionKey: input.actionKey,
                phase: 'tool_call_fitted',
                messages: fittedMessages,
                meta: {
                    producePath: 'tool_call',
                    tool: input.hostTool.name,
                    budgetHints: (_d = input.budgetHints) !== null && _d !== void 0 ? _d : { callKind: 'decision' },
                    preFitMessageCount: input.messages.length,
                    fittedMessageCount: fittedMessages.length,
                    argsSchemaKeys: Object.keys((_e = input.hostTool.argsSchema.properties) !== null && _e !== void 0 ? _e : {}),
                    catalogEnumInjected,
                },
            });
        }
        const bound = model.bindTools(tools, {
            tool_choice: input.hostTool.name,
        });
        didInvoke = true;
        const aiMessage = (await bound.invoke(fittedMessages, {
            signal: input.signal,
        }));
        const responseMeta = aiMessage.response_metadata;
        const usage = (0, llm_response_meta_util_1.extractLlmTokenUsageFromResponseMeta)(responseMeta);
        promptTokens = (_f = usage === null || usage === void 0 ? void 0 : usage.promptTokens) !== null && _f !== void 0 ? _f : null;
        completionTokens = (_g = usage === null || usage === void 0 ? void 0 : usage.completionTokens) !== null && _g !== void 0 ? _g : null;
        modelName =
            (_j = (_h = (0, llm_response_meta_util_1.resolveLlmModelNameFromResponseMeta)(responseMeta)) !== null && _h !== void 0 ? _h : model.model) !== null && _j !== void 0 ? _j : null;
        const toolCalls = (0, decision_util_1.extractToolCalls)(aiMessage);
        const matched = toolCalls.find((call) => call.name === input.hostTool.name);
        if (!matched) {
            if (input.actionRunId != null) {
                (0, page_action_run_debug_util_1.logPageActionLlmResponse)({
                    actionRunId: input.actionRunId,
                    actionKey: input.actionKey,
                    phase: 'tool_call',
                    model: modelName,
                    promptTokens,
                    completionTokens,
                    detail: {
                        ok: false,
                        error: toolCalls.length > 0
                            ? 'host_tool_call_name_mismatch'
                            : 'no_host_tool_call',
                        toolCalls: toolCalls.map((call) => ({
                            name: call.name,
                            arguments: call.arguments,
                        })),
                    },
                });
            }
            return {
                ok: false,
                error: toolCalls.length > 0 ? 'host_tool_call_name_mismatch' : 'no_host_tool_call',
                model: modelName,
                promptTokens,
                completionTokens,
                llmInvoked: true,
                retryWithStreamParse: true,
            };
        }
        const rawArgs = isRecord(matched.arguments) ? matched.arguments : {};
        const unwrapped = (0, host_tool_args_from_llm_util_1.unwrapHostToolArgsEnvelope)(rawArgs, input.hostTool.argsSchema);
        const sanitized = (0, host_tool_args_context_catalog_util_1.sanitizeHostToolArgsAgainstContextCatalogs)(unwrapped, input.hostTool.argsSchema, (_k = input.actionContext) !== null && _k !== void 0 ? _k : null);
        if (!(0, host_tool_args_from_llm_util_1.softValidateHostToolArgsAgainstSchema)(sanitized.args, input.hostTool.argsSchema)) {
            if (input.actionRunId != null) {
                (0, page_action_run_debug_util_1.logPageActionLlmResponse)({
                    actionRunId: input.actionRunId,
                    actionKey: input.actionKey,
                    phase: 'tool_call',
                    model: modelName,
                    promptTokens,
                    completionTokens,
                    detail: {
                        ok: false,
                        error: 'tool_call_args_validate_failed',
                        rawArgs: unwrapped,
                        droppedCatalogIds: sanitized.droppedByField,
                        toolCalls: toolCalls.map((call) => ({
                            name: call.name,
                            arguments: call.arguments,
                        })),
                    },
                });
            }
            return {
                ok: false,
                error: 'tool_call_args_validate_failed',
                model: modelName,
                promptTokens,
                completionTokens,
                llmInvoked: true,
                retryWithStreamParse: true,
            };
        }
        if (input.actionRunId != null) {
            (0, page_action_run_debug_util_1.logPageActionLlmResponse)({
                actionRunId: input.actionRunId,
                actionKey: input.actionKey,
                phase: 'tool_call',
                model: modelName,
                promptTokens,
                completionTokens,
                detail: {
                    ok: true,
                    tool: matched.name,
                    args: sanitized.args,
                    droppedCatalogIds: sanitized.droppedByField,
                    rawArgs: unwrapped,
                },
            });
        }
        return {
            ok: true,
            args: sanitized.args,
            model: modelName,
            promptTokens,
            completionTokens,
            llmInvoked: true,
            retryWithStreamParse: false,
            droppedCatalogIds: sanitized.droppedByField,
        };
    }
    catch (error) {
        if (isLlmAbortError(error, input.signal)) {
            throw error;
        }
        return {
            ok: false,
            error: formatUnknownError(error),
            model: modelName,
            promptTokens,
            completionTokens,
            llmInvoked: didInvoke,
            retryWithStreamParse: true,
        };
    }
}
exports.produceHostToolArgsViaToolCall = produceHostToolArgsViaToolCall;
//# sourceMappingURL=page-action-structured-produce.util.js.map