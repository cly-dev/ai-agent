"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executePageWorkflowSummarize = exports.shouldEmitPageSummarizeLifecycle = void 0;
const decision_util_1 = require("../agent-engine/engine/main/agent-graph/runtime/decision.util");
const llm_output_sanitize_util_1 = require("../agent-engine/engine/llm-output-sanitize.util");
const llm_response_meta_util_1 = require("../llm/llm-response-meta.util");
const page_action_constants_1 = require("./page-action.constants");
const page_action_inline_sse_util_1 = require("./page-action-inline-sse.util");
const workflow_debug_util_1 = require("../workflow/trace/workflow-debug.util");
function shouldEmitPageSummarizeLifecycle(input) {
    var _a;
    const mode = (_a = input.mode) !== null && _a !== void 0 ? _a : 'final';
    return (mode !== 'draft' &&
        !input.existingFillText.trim() &&
        input.summaryText.trim().length > 0 &&
        input.responseWritable);
}
exports.shouldEmitPageSummarizeLifecycle = shouldEmitPageSummarizeLifecycle;
async function executePageWorkflowSummarize(input) {
    var _a, _b, _c, _d, _e, _f, _g;
    const recorder = input.stepRecorder;
    const mode = (_a = input.nodeInput.mode) !== null && _a !== void 0 ? _a : 'final';
    const streamLifecycle = (_b = input.streamLifecycle) !== null && _b !== void 0 ? _b : 'terminal';
    const streamId = (0, page_action_constants_1.buildPageActionStreamId)({
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
    });
    const lifecycleBase = {
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        delivery: 'inline_stream',
        generation: input.generation,
        streamId,
        clientActionId: (_c = input.clientActionId) !== null && _c !== void 0 ? _c : null,
    };
    recorder === null || recorder === void 0 ? void 0 : recorder.recordLlm('summarize.start', {
        messageCount: input.messages.length,
        mode,
    });
    const { model, messages: fittedMessages } = await input.llmService.createLangChainChatModelForMessages(input.messages, {
        budgetHints: { callKind: 'summarize' },
    });
    const aiMessage = (await model.invoke(fittedMessages));
    const responseMeta = aiMessage.response_metadata;
    const summaryText = (0, llm_output_sanitize_util_1.extractLlmUserFacingText)((0, decision_util_1.extractAiMessageText)(aiMessage));
    const usage = (0, llm_response_meta_util_1.extractLlmTokenUsageFromResponseMeta)(responseMeta);
    const resolvedModel = (0, llm_response_meta_util_1.resolveLlmModelNameFromResponseMeta)(responseMeta);
    recorder === null || recorder === void 0 ? void 0 : recorder.recordLlm('summarize.end', {
        summaryTextLength: summaryText.length,
        model: resolvedModel,
        promptTokens: (_d = usage === null || usage === void 0 ? void 0 : usage.promptTokens) !== null && _d !== void 0 ? _d : null,
        completionTokens: (_e = usage === null || usage === void 0 ? void 0 : usage.completionTokens) !== null && _e !== void 0 ? _e : null,
    });
    const shouldEmitTerminal = streamLifecycle === 'terminal' &&
        shouldEmitPageSummarizeLifecycle({
            mode,
            existingFillText: input.existingFillText,
            summaryText,
            responseWritable: !input.res.writableEnded,
        });
    if (shouldEmitTerminal) {
        (0, page_action_inline_sse_util_1.writePageActionLifecycle)(input.res, Object.assign({ phase: 'started' }, lifecycleBase), recorder);
        (0, page_action_inline_sse_util_1.writePageActionLifecycle)(input.res, Object.assign(Object.assign({ phase: 'completed' }, lifecycleBase), { text: summaryText, dslOutcome: null }), recorder);
        (0, page_action_inline_sse_util_1.endInlineSseResponse)(input.res);
    }
    (0, workflow_debug_util_1.logWorkflowDebug)('page_summarize', {
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        mode,
        summaryTextLength: summaryText.length,
        emittedLifecycle: shouldEmitTerminal,
    });
    return {
        summaryText,
        model: resolvedModel,
        promptTokens: (_f = usage === null || usage === void 0 ? void 0 : usage.promptTokens) !== null && _f !== void 0 ? _f : null,
        completionTokens: (_g = usage === null || usage === void 0 ? void 0 : usage.completionTokens) !== null && _g !== void 0 ? _g : null,
        emittedLifecycle: shouldEmitTerminal,
    };
}
exports.executePageWorkflowSummarize = executePageWorkflowSummarize;
//# sourceMappingURL=page-workflow-summarize.util.js.map