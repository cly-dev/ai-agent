"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executePageWorkflowComposeMutation = void 0;
const decision_util_1 = require("../agent-engine/engine/main/agent-graph/runtime/decision.util");
const plan_compose_write_util_1 = require("../agent-engine/engine/main/plan-present/plan-compose-write.util");
const agent_tool_runtime_util_1 = require("../agent-engine/engine/main/runtime/agent-tool-runtime.util");
const write_tool_draft_injection_util_1 = require("../tool-engine/write-tool-draft-injection.util");
const page_workflow_messages_util_1 = require("./page-workflow-messages.util");
const page_workflow_node_util_1 = require("./page-workflow-node.util");
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
    var _a, _b, _c, _d, _e;
    const { runtime } = input;
    const recorder = (_a = input.stepRecorder) !== null && _a !== void 0 ? _a : runtime.stepRecorder;
    const allowedTools = await runtime.prisma.tool.findMany({
        where: {
            id: { in: input.allowedToolIds },
            appClientId: runtime.appClientId,
            isActive: true,
        },
        include: { integration: true },
    });
    const { tools: scopedTools, toolBuildCtx } = (0, agent_tool_runtime_util_1.buildEngineToolsFromAllowed)(allowedTools, runtime.userId, runtime.toolEngine);
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
    recorder.recordLlm('compose_mutation.start', {
        writeToolId: writeTool.id,
        writeToolName: writeTool.name,
        messageCount: messages.length,
    });
    const { model, messages: fittedMessages } = await runtime.llmService.createLangChainChatModelForMessages(messages, {
        budgetHints: { callKind: 'decision' },
    });
    const bound = model.bindTools(writeLangChainTools.tools);
    const aiMessage = (await bound.invoke(fittedMessages));
    const responseMeta = aiMessage.response_metadata;
    const usage = (0, llm_response_meta_util_1.extractLlmTokenUsageFromResponseMeta)(responseMeta);
    const resolvedModel = (0, llm_response_meta_util_1.resolveLlmModelNameFromResponseMeta)(responseMeta);
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
    recorder.recordLlm('compose_mutation.end', {
        writeToolName: writeTool.name,
        argumentKeys: Object.keys(prepared.arguments),
        model: resolvedModel,
    });
    return {
        arguments: prepared.arguments,
        model: resolvedModel,
        promptTokens: (_d = usage === null || usage === void 0 ? void 0 : usage.promptTokens) !== null && _d !== void 0 ? _d : null,
        completionTokens: (_e = usage === null || usage === void 0 ? void 0 : usage.completionTokens) !== null && _e !== void 0 ? _e : null,
    };
}
exports.executePageWorkflowComposeMutation = executePageWorkflowComposeMutation;
//# sourceMappingURL=page-workflow-compose-mutation.util.js.map