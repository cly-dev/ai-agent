"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executePageWorkflowSummarize = exports.shouldEmitPageSummarizeLifecycle = void 0;
const page_action_constants_1 = require("./page-action.constants");
const page_action_run_audit_util_1 = require("./page-action-run-audit.util");
const workflow_debug_util_1 = require("../workflow/trace/workflow-debug.util");
const page_action_prose_stream_util_1 = require("./page-action-prose-stream.util");
const llm_user_facing_text_util_1 = require("../llm/llm-user-facing-text.util");
const llm_response_meta_util_1 = require("../llm/llm-response-meta.util");
function shouldEmitPageSummarizeLifecycle(input) {
    var _a;
    const mode = (_a = input.mode) !== null && _a !== void 0 ? _a : 'final';
    return (mode !== 'draft' &&
        !input.existingFillText.trim() &&
        input.summaryText.trim().length > 0 &&
        input.responseWritable);
}
exports.shouldEmitPageSummarizeLifecycle = shouldEmitPageSummarizeLifecycle;
function shouldPageSummarizeUseLlmStream(input) {
    var _a;
    if (input.nodeInput.stream === false) {
        return false;
    }
    if (input.streamLifecycle === 'none') {
        return false;
    }
    const mode = (_a = input.nodeInput.mode) !== null && _a !== void 0 ? _a : 'final';
    if (mode === 'draft') {
        return false;
    }
    return true;
}
async function executePageWorkflowSummarizeInvoke(input) {
    var _a, _b, _c, _d, _e;
    const recorder = input.stepRecorder;
    recorder === null || recorder === void 0 ? void 0 : recorder.recordLlm('summarize.start', Object.assign({ messageCount: input.messages.length, mode: (_a = input.mode) !== null && _a !== void 0 ? _a : 'final' }, (0, page_action_run_audit_util_1.buildLlmStepAudit)({
        systemPrompt: input.systemPrompt,
        objectivePrefix: input.objectivePrefix,
        nodeObjective: input.nodeObjective,
        promptMessages: input.messages,
    })));
    const { model, messages: fittedMessages } = await input.llmService.createLangChainChatModelForMessages(input.messages, {
        budgetHints: { callKind: 'summarize' },
    });
    const aiMessage = (await model.invoke(fittedMessages));
    const responseMeta = aiMessage.response_metadata;
    const assistantText = (0, llm_user_facing_text_util_1.extractAiMessageContentChannel)(aiMessage);
    const summaryText = (0, llm_user_facing_text_util_1.resolveLlmUserFacingTextFromAiMessage)(aiMessage);
    const usage = (0, llm_response_meta_util_1.extractLlmTokenUsageFromResponseMeta)(responseMeta);
    const resolvedModel = (0, llm_response_meta_util_1.resolveLlmModelNameFromResponseMeta)(responseMeta);
    recorder === null || recorder === void 0 ? void 0 : recorder.recordLlm('summarize.end', Object.assign({ summaryTextLength: summaryText.length, summaryText: (0, page_action_run_audit_util_1.summarizeTextForAudit)(summaryText, 4000), model: resolvedModel, promptTokens: (_b = usage === null || usage === void 0 ? void 0 : usage.promptTokens) !== null && _b !== void 0 ? _b : null, completionTokens: (_c = usage === null || usage === void 0 ? void 0 : usage.completionTokens) !== null && _c !== void 0 ? _c : null, fittedMessageCount: fittedMessages.length, delivery: 'invoke' }, (0, page_action_run_audit_util_1.buildLlmOutputStepAudit)({
        assistantText,
        userFacingText: summaryText,
    })));
    return {
        summaryText,
        model: resolvedModel,
        promptTokens: (_d = usage === null || usage === void 0 ? void 0 : usage.promptTokens) !== null && _d !== void 0 ? _d : null,
        completionTokens: (_e = usage === null || usage === void 0 ? void 0 : usage.completionTokens) !== null && _e !== void 0 ? _e : null,
        assistantText,
    };
}
async function executePageWorkflowSummarize(input) {
    var _a, _b;
    const recorder = input.stepRecorder;
    const mode = (_a = input.nodeInput.mode) !== null && _a !== void 0 ? _a : 'final';
    const streamLifecycle = (_b = input.streamLifecycle) !== null && _b !== void 0 ? _b : 'terminal';
    const streamId = (0, page_action_constants_1.buildPageActionStreamId)({
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        segment: input.streamIdSegment,
    });
    const useLlmStream = shouldPageSummarizeUseLlmStream({
        nodeInput: input.nodeInput,
        streamLifecycle,
    });
    if (useLlmStream) {
        const streamResult = await (0, page_action_prose_stream_util_1.executePageActionProseStream)({
            llmService: input.llmService,
            messages: input.messages,
            sseSink: input.sseSink,
            actionRunId: input.actionRunId,
            actionKey: input.actionKey,
            generation: input.generation,
            streamId,
            clientActionId: input.clientActionId,
            stepRecorder: recorder,
            signal: input.signal,
            budgetHints: { callKind: 'summarize' },
            llmAudit: {
                startName: 'summarize.start',
                endName: 'summarize.end',
                startDetail: Object.assign({ mode }, (0, page_action_run_audit_util_1.buildLlmStepAudit)({
                    systemPrompt: input.systemPrompt,
                    objectivePrefix: input.objectivePrefix,
                    nodeObjective: input.nodeObjective,
                    promptMessages: input.messages,
                })),
            },
        });
        (0, workflow_debug_util_1.logWorkflowDebug)('page_summarize', {
            actionRunId: input.actionRunId,
            actionKey: input.actionKey,
            mode,
            delivery: 'prose_stream',
            summaryTextLength: streamResult.summaryText.length,
        });
        return {
            summaryText: streamResult.summaryText,
            dslOutcome: null,
            model: streamResult.model,
            promptTokens: streamResult.promptTokens,
            completionTokens: streamResult.completionTokens,
            emittedLifecycle: false,
        };
    }
    const invoked = await executePageWorkflowSummarizeInvoke({
        llmService: input.llmService,
        messages: input.messages,
        stepRecorder: recorder,
        mode,
        systemPrompt: input.systemPrompt,
        objectivePrefix: input.objectivePrefix,
        nodeObjective: input.nodeObjective,
    });
    (0, workflow_debug_util_1.logWorkflowDebug)('page_summarize', {
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        mode,
        delivery: 'invoke',
        summaryTextLength: invoked.summaryText.length,
    });
    return {
        summaryText: invoked.summaryText,
        dslOutcome: null,
        model: invoked.model,
        promptTokens: invoked.promptTokens,
        completionTokens: invoked.completionTokens,
        emittedLifecycle: false,
    };
}
exports.executePageWorkflowSummarize = executePageWorkflowSummarize;
//# sourceMappingURL=page-workflow-summarize.util.js.map