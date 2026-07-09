"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executePageWorkflowComposeMutation = void 0;
const decision_util_1 = require("../agent-engine/engine/main/agent-graph/runtime/decision.util");
const plan_compose_write_util_1 = require("../agent-engine/engine/main/plan-present/plan-compose-write.util");
const write_tool_draft_injection_util_1 = require("../tool-engine/write-tool-draft-injection.util");
const page_workflow_messages_util_1 = require("./page-workflow-messages.util");
const page_workflow_node_util_1 = require("./page-workflow-node.util");
const page_action_run_audit_util_1 = require("./page-action-run-audit.util");
const llm_user_facing_text_util_1 = require("../llm/llm-user-facing-text.util");
const llm_response_meta_util_1 = require("../llm/llm-response-meta.util");
function collectReadObservationsFromNodeOutputs(nodeOutputs) {
    const observations = [];
    for (const value of Object.values(nodeOutputs)) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            continue;
        }
        const row = value;
        const toolName = typeof row.toolName === 'string' ? row.toolName.trim() : '';
        if (!toolName || !('output' in row)) {
            continue;
        }
        observations.push({
            name: toolName,
            output: row.output,
            quality: 'high',
        });
    }
    return observations;
}
async function executePageWorkflowComposeMutation(input) {
    var _a, _b, _c, _d, _e, _f, _g;
    const { runtime } = input;
    const recorder = (_a = input.stepRecorder) !== null && _a !== void 0 ? _a : runtime.stepRecorder;
    const toolBundle = runtime.toolBundle;
    if (!toolBundle) {
        throw new Error('Page workflow tool bundle is not initialized');
    }
    const scopedTools = toolBundle.engineTools;
    const toolBuildCtx = toolBundle.toolBuildCtx;
    const writeTool = scopedTools.find((row) => row.id === input.writeToolId);
    if (!writeTool) {
        throw new Error(`Write tool id=${input.writeToolId} not in allowed tools`);
    }
    const writeLangChainTools = runtime.toolEngine.buildLangChainTools(scopedTools.filter((row) => row.id === input.writeToolId), toolBuildCtx);
    const messages = (0, page_workflow_messages_util_1.injectWorkflowNodeObjective)((0, page_workflow_messages_util_1.appendWorkflowNodeOutputsToMessages)(runtime.messages, runtime.nodeOutputs), input.def.objective, runtime.objectivePrefix);
    messages.push({
        role: 'user',
        content: [
            `Produce write parameters by calling tool \`${writeTool.name}\` exactly once.`,
            'Do not execute HTTP — only emit tool_call arguments for later user confirmation.',
        ].join(' '),
    });
    recorder.recordLlm('compose_mutation.start', Object.assign({ writeToolId: writeTool.id, writeToolName: writeTool.name, messageCount: messages.length }, (0, page_action_run_audit_util_1.buildLlmStepAudit)({
        systemPrompt: runtime.systemPrompt,
        objectivePrefix: runtime.objectivePrefix,
        nodeObjective: input.def.objective,
        promptMessages: messages,
    })));
    const { model, messages: fittedMessages } = await runtime.llmService.createLangChainChatModelForMessages(messages, {
        budgetHints: { callKind: 'decision' },
    });
    const bound = model.bindTools(writeLangChainTools.tools);
    const aiMessage = (await bound.invoke(fittedMessages));
    const responseMeta = aiMessage.response_metadata;
    const usage = (0, llm_response_meta_util_1.extractLlmTokenUsageFromResponseMeta)(responseMeta);
    const resolvedModel = (0, llm_response_meta_util_1.resolveLlmModelNameFromResponseMeta)(responseMeta);
    const assistantText = (0, llm_user_facing_text_util_1.extractAiMessageContentChannel)(aiMessage);
    const toolCalls = (0, decision_util_1.extractToolCalls)(aiMessage);
    const rawCall = toolCalls.find((call) => call.name === writeTool.name);
    if (!rawCall) {
        throw new Error(`LLM did not emit tool_call for write tool ${writeTool.name}`);
    }
    const observations = collectReadObservationsFromNodeOutputs(runtime.nodeOutputs);
    const prepared = (0, plan_compose_write_util_1.prepareComposeWriteToolCall)({
        toolCall: rawCall,
        writeTool,
        observations,
        scopedTools,
        pageContext: runtime.pageContext,
    });
    const missingPath = (0, write_tool_draft_injection_util_1.findMissingRequiredWriteToolArgPath)(prepared.arguments, writeTool);
    if (missingPath) {
        throw new Error(`Composed write arguments missing required field: ${missingPath}`);
    }
    (0, page_workflow_node_util_1.mergePageWorkflowLlmMetrics)(runtime.metrics, {
        model: resolvedModel,
        promptTokens: (_b = usage === null || usage === void 0 ? void 0 : usage.promptTokens) !== null && _b !== void 0 ? _b : null,
        completionTokens: (_c = usage === null || usage === void 0 ? void 0 : usage.completionTokens) !== null && _c !== void 0 ? _c : null,
    });
    recorder.recordLlm('compose_mutation.end', Object.assign({ writeToolName: writeTool.name, writeToolId: writeTool.id, argumentKeys: Object.keys(prepared.arguments), writeArguments: (0, page_action_run_audit_util_1.summarizeRecordForAudit)(prepared.arguments), model: resolvedModel, promptTokens: (_d = usage === null || usage === void 0 ? void 0 : usage.promptTokens) !== null && _d !== void 0 ? _d : null, completionTokens: (_e = usage === null || usage === void 0 ? void 0 : usage.completionTokens) !== null && _e !== void 0 ? _e : null, fittedMessageCount: fittedMessages.length }, (0, page_action_run_audit_util_1.buildLlmOutputStepAudit)({
        assistantText,
        userFacingText: (0, llm_user_facing_text_util_1.resolveLlmUserFacingTextFromAiMessage)(aiMessage),
        toolCall: {
            name: rawCall.name,
            arguments: rawCall.arguments,
        },
        structuredOutput: prepared.arguments,
    })));
    return {
        arguments: prepared.arguments,
        model: resolvedModel,
        promptTokens: (_f = usage === null || usage === void 0 ? void 0 : usage.promptTokens) !== null && _f !== void 0 ? _f : null,
        completionTokens: (_g = usage === null || usage === void 0 ? void 0 : usage.completionTokens) !== null && _g !== void 0 ? _g : null,
    };
}
exports.executePageWorkflowComposeMutation = executePageWorkflowComposeMutation;
//# sourceMappingURL=page-workflow-compose-mutation.util.js.map