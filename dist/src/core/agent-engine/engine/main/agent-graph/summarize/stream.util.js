"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeToolOutputForUser = exports.summarizePlanPresentWithPendingWrite = exports.summarizeDirectUserMessage = exports.summarizeSkillIntentMismatch = exports.summarizeClarificationRequest = exports.summarizeDirectLlmReply = exports.summarizeWriteConfirmResume = void 0;
const prompt_template_keys_1 = require("../../../../../prompt/prompt-template.keys");
const message_blocks_util_1 = require("../../../message/message-blocks.util");
const write_confirm_resume_summary_util_1 = require("../../../write-confirm-resume-summary.util");
const write_confirm_resume_blocks_util_1 = require("../../../write-confirm-resume-blocks.util");
const tool_execution_status_util_1 = require("../../../tool/tool-execution-status.util");
const observation_format_util_1 = require("../../../observation-format.util");
const tool_output_projection_util_1 = require("../../../../../tool-engine/tool-output-projection.util");
const user_response_style_util_1 = require("../../../user-response-style.util");
const agent_run_user_messages_util_1 = require("../../../agent-run-user-messages.util");
const list_map_reduce_util_1 = require("../../../gather/list-map-reduce.util");
const task_plan_util_1 = require("../../plan/task-plan.util");
const summarize_llm_delivery_util_1 = require("../../summarize/summarize-llm-delivery.util");
const plan_present_orchestrate_util_1 = require("../../plan-present/plan-present-orchestrate.util");
const decision_util_1 = require("../runtime/decision.util");
const host_tool_fill_alignment_util_1 = require("../../host-tool/host-tool-fill-alignment.util");
const observation_util_1 = require("./observation.util");
async function summarizeWriteConfirmResume(deps, input) {
    var _a;
    const { payload, mergedToolOutput, toolResultsText, confirmedPreviewSerialized, promptMessages, sessionId, runId, turnId, scope, taskPlan, } = input;
    const fallbackPlain = (0, observation_util_1.buildWriteConfirmResumeFallbackPlainText)(payload);
    const fallbackBlocks = (0, observation_util_1.buildWriteConfirmResumeFallbackBlocks)(payload);
    const turnIdResolved = (_a = deps.assistantArtifact.peekTurnId(sessionId, runId)) !== null && _a !== void 0 ? _a : turnId;
    const publishFinalBlocks = (blocks) => {
        const sanitized = deps.sse.publishAssistantBlocks(sessionId, runId, blocks, { turnId: turnIdResolved, phase: 'final' });
        return (0, message_blocks_util_1.serializeMessageBlocksForStorage)(sanitized.length > 0 ? sanitized : blocks);
    };
    if (payload.outcome === 'failed') {
        return publishFinalBlocks(fallbackBlocks);
    }
    const confirmedPreview = (0, write_confirm_resume_blocks_util_1.parseConfirmedPreviewBlocks)(confirmedPreviewSerialized);
    if (confirmedPreview.length > 0) {
        const observationStructured = (0, message_blocks_util_1.buildRuleBasedMessageBlocks)({
            output: mergedToolOutput,
            userMessage: payload.userMessage,
            fieldLabels: {},
        }).filter(message_blocks_util_1.isStructuredMessageBlock);
        const merged = (0, write_confirm_resume_blocks_util_1.mergeConfirmedPreviewWithExecutionStatus)({
            confirmedPreview,
            executionStatusBlocks: fallbackBlocks,
            observationStructuredBlocks: observationStructured,
        });
        return publishFinalBlocks(merged);
    }
    const agentPrompts = promptMessages.filter((message) => message.role === 'system' && message.content.includes('<agent_prompt>'));
    const summarizeMessages = [
        ...agentPrompts,
        {
            role: 'system',
            content: await deps.promptRegistry.render(prompt_template_keys_1.PROMPT_KEYS.AGENT_SUMMARIZE_WRITE_CONFIRM_RESUME, scope),
        },
        {
            role: 'user',
            content: (0, write_confirm_resume_summary_util_1.formatWriteConfirmResumeSummarizeUserMessage)({
                payload,
                taskPlan,
                toolResultsJson: toolResultsText,
            }),
        },
    ];
    try {
        const { blocks } = await deps.sse.summarizeMessageBlocks(summarizeMessages, sessionId, runId, fallbackBlocks, fallbackPlain, (0, summarize_llm_delivery_util_1.resolveSummarizeLlmDelivery)(prompt_template_keys_1.PROMPT_KEYS.AGENT_SUMMARIZE_WRITE_CONFIRM_RESUME));
        return (0, message_blocks_util_1.serializeMessageBlocksForStorage)(blocks);
    }
    catch (error) {
        deps.logger.warn(`write confirm resume summarize fallback: ${error instanceof Error ? error.message : String(error)}`);
        const published = deps.sse.publishAssistantBlocks(sessionId, runId, fallbackBlocks);
        return (0, message_blocks_util_1.serializeMessageBlocksForStorage)(published.length > 0 ? published : fallbackBlocks);
    }
}
exports.summarizeWriteConfirmResume = summarizeWriteConfirmResume;
async function summarizeDirectLlmReply(deps, userMessage, output, promptMessages, sessionId, runId, scope) {
    const draftReply = (0, observation_util_1.extractDirectReplyDraft)(output);
    const fallback = draftReply || '抱歉，我暂时无法回答这个问题。';
    const agentPrompts = promptMessages.filter((message) => message.role === 'system' && message.content.includes('<agent_prompt>'));
    const summarizeMessages = [
        ...agentPrompts,
        {
            role: 'system',
            content: await deps.promptRegistry.render(prompt_template_keys_1.PROMPT_KEYS.AGENT_SUMMARIZE_MESSAGE_BLOCKS, scope),
        },
        {
            role: 'user',
            content: [
                `User request: ${userMessage}`,
                `Assistant draft (polish as user-facing Markdown; do not invent facts beyond the draft): ${draftReply}`,
            ].join('\n'),
        },
    ];
    try {
        const { blocks } = await deps.sse.summarizeMessageBlocks(summarizeMessages, sessionId, runId, [], fallback, (0, summarize_llm_delivery_util_1.resolveSummarizeLlmDelivery)(prompt_template_keys_1.PROMPT_KEYS.AGENT_SUMMARIZE_MESSAGE_BLOCKS));
        return (0, message_blocks_util_1.serializeMessageBlocksForStorage)(blocks);
    }
    catch (error) {
        deps.logger.warn(`direct reply summarize fallback: ${error instanceof Error ? error.message : String(error)}`);
        const blocks = deps.sse.publishAssistantBlocks(sessionId, runId, [
            (0, message_blocks_util_1.textBlock)(fallback),
        ]);
        return (0, message_blocks_util_1.serializeMessageBlocksForStorage)(blocks);
    }
}
exports.summarizeDirectLlmReply = summarizeDirectLlmReply;
async function summarizeClarificationRequest(deps, userMessage, output, promptMessages, sessionId, runId, scope, taskPlan, publishMode) {
    const parsed = (0, observation_util_1.parseClarificationRequestOutput)(output);
    const planContext = (0, task_plan_util_1.formatPlanContextForSummarize)(taskPlan);
    const missingFieldsText = parsed.missingFields.length > 0
        ? parsed.missingFields
            .map((field) => `- ${field.name}: ${field.hint}`)
            .join('\n')
        : '(none listed)';
    const agentPrompts = promptMessages.filter((message) => message.role === 'system' && message.content.includes('<agent_prompt>'));
    const summarizeMessages = [...agentPrompts];
    summarizeMessages.push({
        role: 'system',
        content: await deps.promptRegistry.render(prompt_template_keys_1.PROMPT_KEYS.AGENT_RESPOND_CLARIFICATION, scope),
    });
    summarizeMessages.push({
        role: 'user',
        content: [
            `User request: ${userMessage}`,
            planContext ? `<plan_context>\n${planContext}\n</plan_context>` : null,
            parsed.toolRole ? `Pending tool role: ${parsed.toolRole}` : null,
            `Missing fields:\n${missingFieldsText}`,
        ]
            .filter((line) => line != null && line.length > 0)
            .join('\n'),
    });
    const fallback = parsed.missingFields.length > 0
        ? `请补充以下信息：${parsed.missingFields.map((field) => field.hint).join('；')}`
        : '请补充更具体的查询条件后我再试一次。';
    try {
        const { blocks } = await deps.sse.summarizeMessageBlocks(summarizeMessages, sessionId, runId, [], fallback, (0, summarize_llm_delivery_util_1.resolveSummarizeLlmDelivery)(prompt_template_keys_1.PROMPT_KEYS.AGENT_RESPOND_CLARIFICATION), publishMode);
        return (0, message_blocks_util_1.serializeMessageBlocksForStorage)(blocks);
    }
    catch (error) {
        deps.logger.warn(`clarification summarize fallback: ${error instanceof Error ? error.message : String(error)}`);
        const published = deps.sse.publishAssistantBlocks(sessionId, runId, [
            (0, message_blocks_util_1.textBlock)(fallback),
        ]);
        return (0, message_blocks_util_1.serializeMessageBlocksForStorage)(published.length > 0 ? published : [(0, message_blocks_util_1.textBlock)(fallback)]);
    }
}
exports.summarizeClarificationRequest = summarizeClarificationRequest;
async function summarizeSkillIntentMismatch(deps, userMessage, output, promptMessages, sessionId, runId, scope, publishMode) {
    var _a;
    const parsed = (0, observation_util_1.parseSkillIntentMismatchOutput)(output);
    const effectiveUserMessage = parsed.userMessage || userMessage;
    const fallback = (0, observation_util_1.buildSkillIntentMismatchFallbackPlainText)({
        mismatchCode: parsed.mismatchCode,
        requestedSkillName: parsed.requestedSkillName,
    });
    const agentPrompts = promptMessages.filter((message) => message.role === 'system' && message.content.includes('<agent_prompt>'));
    const summarizeMessages = [...agentPrompts];
    summarizeMessages.push({
        role: 'system',
        content: await deps.promptRegistry.render(prompt_template_keys_1.PROMPT_KEYS.AGENT_RESPOND_SKILL_INTENT_MISMATCH, scope),
    });
    summarizeMessages.push({
        role: 'user',
        content: [
            `User request: ${effectiveUserMessage}`,
            parsed.requestedSkillName
                ? `Requested skill: ${parsed.requestedSkillName} (id=${(_a = parsed.requestedSkillId) !== null && _a !== void 0 ? _a : 'unknown'})`
                : null,
            parsed.mismatchCode ? `mismatchCode: ${parsed.mismatchCode}` : null,
            parsed.routingReason ? `Routing reason: ${parsed.routingReason}` : null,
        ]
            .filter((line) => line != null && line.length > 0)
            .join('\n'),
    });
    try {
        const { blocks } = await deps.sse.summarizeMessageBlocks(summarizeMessages, sessionId, runId, [], fallback, (0, summarize_llm_delivery_util_1.resolveSummarizeLlmDelivery)(prompt_template_keys_1.PROMPT_KEYS.AGENT_RESPOND_SKILL_INTENT_MISMATCH), publishMode);
        return (0, message_blocks_util_1.serializeMessageBlocksForStorage)(blocks);
    }
    catch (error) {
        deps.logger.warn(`skill intent mismatch summarize fallback: ${error instanceof Error ? error.message : String(error)}`);
        const published = deps.sse.publishAssistantBlocks(sessionId, runId, [
            (0, message_blocks_util_1.textBlock)(fallback),
        ]);
        return (0, message_blocks_util_1.serializeMessageBlocksForStorage)(published.length > 0 ? published : [(0, message_blocks_util_1.textBlock)(fallback)]);
    }
}
exports.summarizeSkillIntentMismatch = summarizeSkillIntentMismatch;
async function summarizeDirectUserMessage(deps, userMessage, output, promptMessages, sessionId, runId, scope, taskPlan, publishMode, workflowRun, workflowNodeDefs) {
    const guidanceHint = (0, observation_util_1.extractDirectUserGuidanceHint)(output);
    const planContext = (0, task_plan_util_1.formatPlanContextForSummarize)(taskPlan);
    const planAnswerStep = (0, task_plan_util_1.isPendingPlanAnswerStep)(taskPlan, workflowRun, workflowNodeDefs);
    const fallback = guidanceHint || 'Hello! How can I help you?';
    const summarizePromptKey = prompt_template_keys_1.PROMPT_KEYS.AGENT_SUMMARIZE_MESSAGE_BLOCKS;
    const agentPrompts = promptMessages.filter((message) => message.role === 'system' && message.content.includes('<agent_prompt>'));
    const summarizeMessages = [...agentPrompts];
    summarizeMessages.push({
        role: 'system',
        content: await deps.promptRegistry.render(summarizePromptKey, scope),
    });
    summarizeMessages.push({
        role: 'user',
        content: planAnswerStep
            ? [
                `User request: ${userMessage}`,
                planContext ? `<plan_context>\n${planContext}\n</plan_context>` : null,
                guidanceHint ? `Guidance: ${guidanceHint}` : null,
            ]
                .filter((line) => line != null && line.length > 0)
                .join('\n')
            : guidanceHint
                ? [`User request: ${userMessage}`, `Guidance: ${guidanceHint}`].join('\n')
                : userMessage,
    });
    try {
        const { blocks } = await deps.sse.summarizeMessageBlocks(summarizeMessages, sessionId, runId, [], fallback, (0, summarize_llm_delivery_util_1.resolveSummarizeLlmDelivery)(summarizePromptKey), publishMode);
        return (0, message_blocks_util_1.serializeMessageBlocksForStorage)(blocks);
    }
    catch (error) {
        deps.logger.warn(`direct user summarize fallback: ${error instanceof Error ? error.message : String(error)}`);
        const blocks = deps.sse.publishAssistantBlocks(sessionId, runId, [
            (0, message_blocks_util_1.textBlock)(fallback),
        ]);
        return (0, message_blocks_util_1.serializeMessageBlocksForStorage)(blocks);
    }
}
exports.summarizeDirectUserMessage = summarizeDirectUserMessage;
async function summarizePlanPresentWithPendingWrite(deps, toolName, toolDescription, userMessage, mergedObservation, toolObservations, promptMessages, sessionId, runId, scope, taskPlan, scopedTools, workflowRun, workflowNodeDefs) {
    return (0, plan_present_orchestrate_util_1.runPlanPresentSummarize)(deps, {
        toolName,
        toolDescription,
        userMessage,
        mergedObservation,
        toolObservations,
        promptMessages,
        sessionId,
        runId,
        scope,
        taskPlan,
        scopedTools,
        workflowRun,
        workflowNodeDefs,
    });
}
exports.summarizePlanPresentWithPendingWrite = summarizePlanPresentWithPendingWrite;
async function summarizeToolOutputForUser(deps, toolName, toolDescription, userMessage, output, fieldLabels, fieldDescriptions, enumLabelsByPath, promptMessages, sessionId, runId, scope, taskPlan, agentMetadata, executedArgs, publishMode, sessionObservations, workflowRun, workflowNodeDefs) {
    var _a, _b, _c;
    const splitOutput = (0, observation_format_util_1.isSplitToolObservationsOutput)(output) ? output : null;
    const primaryObservation = splitOutput
        ? (0, observation_format_util_1.resolvePrimaryObservationForSummarize)(splitOutput)
        : null;
    const primaryOutput = (_a = primaryObservation === null || primaryObservation === void 0 ? void 0 : primaryObservation.output) !== null && _a !== void 0 ? _a : output;
    const fullDetail = (0, user_response_style_util_1.isUserRequestingFullDetail)(userMessage);
    const toolErrorObs = (0, agent_run_user_messages_util_1.isAgentToolErrorObservation)(primaryOutput)
        ? primaryOutput
        : null;
    const summarizeScenario = (0, tool_execution_status_util_1.isMutationTool)(agentMetadata) ||
        (0, user_response_style_util_1.classifySummarizeScenario)(userMessage) === 'action'
        ? 'action'
        : 'read';
    const planContext = (0, host_tool_fill_alignment_util_1.buildPlanContextForSummarize)(taskPlan, sessionObservations);
    const serialized = (0, decision_util_1.stringifyForPrompt)(primaryOutput);
    const splitObservationsText = splitOutput
        ? (0, observation_format_util_1.formatSplitToolObservationsForSummarize)(splitOutput)
        : null;
    const fieldLabelText = (0, tool_output_projection_util_1.formatFieldLabelsForPrompt)(fieldLabels, enumLabelsByPath, fieldDescriptions);
    const agentPrompts = promptMessages.filter((message) => message.role === 'system' && message.content.includes('<agent_prompt>'));
    const ruleBlocks = (0, message_blocks_util_1.buildRuleBasedMessageBlocks)({
        output: primaryOutput,
        userMessage,
        fieldLabels,
    });
    const planAnswerStep = (0, task_plan_util_1.isPendingPlanAnswerStep)(taskPlan, workflowRun, workflowNodeDefs);
    const summarizePromptKey = (0, observation_util_1.resolveSummarizePromptKey)({
        taskPlan,
        workflowRun,
        workflowNodeDefs,
        fullDetail,
        summarizeScenario,
    });
    const summarizeMessages = [...agentPrompts];
    summarizeMessages.push({
        role: 'system',
        content: await deps.promptRegistry.render(summarizePromptKey, scope),
    });
    const downstreamSourceText = (toolErrorObs === null || toolErrorObs === void 0 ? void 0 : toolErrorObs.responseSource) != null
        ? (0, agent_run_user_messages_util_1.formatResponseSourceForDisplay)(toolErrorObs.responseSource)
        : '';
    const mapReduceFetchNote = (0, list_map_reduce_util_1.formatMapReduceFetchStatusNote)(primaryOutput);
    summarizeMessages.push({
        role: 'user',
        content: [
            `User request: ${userMessage}`,
            planContext ? `<plan_context>\n${planContext}\n</plan_context>` : null,
            mapReduceFetchNote ? `Fetch status: ${mapReduceFetchNote}` : null,
            `Tool: ${toolName}`,
            toolDescription ? `Tool description: ${toolDescription}` : null,
            executedArgs && Object.keys(executedArgs).length > 0
                ? `Executed arguments: ${JSON.stringify(executedArgs)}`
                : null,
            fieldLabelText ? `Field labels:\n${fieldLabelText}` : null,
            ruleBlocks.length > 0
                ? `Suggested rule-based blocks (avoid duplicating the same table): ${JSON.stringify(ruleBlocks)}`
                : null,
            toolErrorObs
                ? `Tool error summary: ${toolErrorObs.userHint}${toolErrorObs.httpStatus != null
                    ? ` (HTTP ${toolErrorObs.httpStatus})`
                    : ''}`
                : null,
            downstreamSourceText
                ? `Downstream response (source data — base your answer on this, include key fields in the user message):\n${downstreamSourceText}`
                : null,
            splitObservationsText
                ? `Tool observations (prefer current_run_observations for the latest request):\n${splitObservationsText}`
                : `Tool result: ${serialized}`,
        ]
            .filter((line) => line != null && line.length > 0)
            .join('\n'),
    });
    const fallbackPlainText = (0, observation_util_1.buildSummarizeFallbackPlainText)(toolName, primaryOutput, ruleBlocks);
    try {
        const { blocks } = await deps.sse.summarizeMessageBlocks(summarizeMessages, sessionId, runId, ruleBlocks, fallbackPlainText, (0, summarize_llm_delivery_util_1.resolveSummarizeLlmDelivery)(summarizePromptKey), publishMode);
        return (0, message_blocks_util_1.serializeMessageBlocksForStorage)(blocks);
    }
    catch (error) {
        deps.logger.warn(`tool result summarize fallback: ${error instanceof Error ? error.message : String(error)}`);
    }
    const fallbackBlocks = (0, message_blocks_util_1.mergeSummarizeBlocksForStorage)(ruleBlocks, [], fallbackPlainText);
    if ((publishMode === null || publishMode === void 0 ? void 0 : publishMode.emitAuthoritativeFull) === false) {
        deps.sse.commitAssistantArtifact(sessionId, runId, fallbackBlocks, (_b = publishMode.artifactPhase) !== null && _b !== void 0 ? _b : 'draft');
        return (0, message_blocks_util_1.serializeMessageBlocksForStorage)(fallbackBlocks);
    }
    const published = deps.sse.publishAssistantBlocks(sessionId, runId, fallbackBlocks, { phase: (_c = publishMode === null || publishMode === void 0 ? void 0 : publishMode.artifactPhase) !== null && _c !== void 0 ? _c : 'final' });
    return (0, message_blocks_util_1.serializeMessageBlocksForStorage)(published.length > 0 ? published : fallbackBlocks);
}
exports.summarizeToolOutputForUser = summarizeToolOutputForUser;
//# sourceMappingURL=stream.util.js.map