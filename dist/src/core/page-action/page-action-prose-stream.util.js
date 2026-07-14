"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executePageActionProseStream = exports.replayPageActionProseStream = void 0;
const summarize_prose_stream_util_1 = require("../agent-engine/engine/summarize-prose-stream.util");
const llm_response_meta_util_1 = require("../llm/llm-response-meta.util");
const page_action_run_audit_util_1 = require("./page-action-run-audit.util");
const page_action_inline_sse_util_1 = require("./page-action-inline-sse.util");
const page_action_run_debug_util_1 = require("./page-action-run-debug.util");
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
function replayPageActionProseStream(input) {
    const prose = input.fillText.trim();
    if (!prose || input.sseSink.writableEnded) {
        return 0;
    }
    let deltaCount = 0;
    const proseSession = (0, summarize_prose_stream_util_1.createSummarizeProseStreamSession)({
        onProseDelta: (delta) => {
            if (!delta || input.sseSink.writableEnded) {
                return;
            }
            deltaCount += 1;
            (0, page_action_inline_sse_util_1.writePageActionStreamDelta)(input.sseSink, Object.assign(Object.assign({}, input.lifecycle), { text: delta }));
        },
    });
    proseSession.replayRoutedMessage(prose);
    return deltaCount;
}
exports.replayPageActionProseStream = replayPageActionProseStream;
async function executePageActionProseStream(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    const recorder = input.stepRecorder;
    const startName = (_b = (_a = input.llmAudit) === null || _a === void 0 ? void 0 : _a.startName) !== null && _b !== void 0 ? _b : 'summarize.start';
    const endName = (_d = (_c = input.llmAudit) === null || _c === void 0 ? void 0 : _c.endName) !== null && _d !== void 0 ? _d : 'summarize.end';
    let deltaCount = 0;
    let streamedRaw = '';
    const lifecycle = {
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        delivery: 'inline_stream',
        generation: input.generation,
        streamId: input.streamId,
        clientActionId: (_e = input.clientActionId) !== null && _e !== void 0 ? _e : null,
    };
    const proseSession = (0, summarize_prose_stream_util_1.createSummarizeProseStreamSession)({
        onProseDelta: (delta) => {
            if (!delta || input.sseSink.writableEnded) {
                return;
            }
            deltaCount += 1;
            (0, page_action_inline_sse_util_1.writePageActionStreamDelta)(input.sseSink, Object.assign(Object.assign({}, lifecycle), { text: delta }));
        },
    });
    recorder === null || recorder === void 0 ? void 0 : recorder.recordLlm(startName, Object.assign({ messageCount: input.messages.length, delivery: 'prose_stream', producePath: 'page_action_delta' }, (_f = input.llmAudit) === null || _f === void 0 ? void 0 : _f.startDetail));
    (0, page_action_run_debug_util_1.logPageActionLlmPrompt)({
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        phase: 'prose_stream',
        messages: input.messages,
        meta: { streamId: input.streamId },
    });
    if ((_g = input.signal) === null || _g === void 0 ? void 0 : _g.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError');
    }
    const streamResult = await input.llmService.streamChat({
        messages: input.messages,
        tools: [],
        signal: input.signal,
        budgetHints: (_h = input.budgetHints) !== null && _h !== void 0 ? _h : { callKind: 'summarize' },
    }, {
        signal: input.signal,
        onDelta: (delta) => {
            if (!delta.contentDelta) {
                return;
            }
            streamedRaw += delta.contentDelta;
            proseSession.ingestLlmDelta(delta.contentDelta);
        },
    });
    const responseMeta = responseMetaFromStreamRaw(streamResult.raw);
    const usage = (0, llm_response_meta_util_1.extractLlmTokenUsageFromResponseMeta)(responseMeta);
    const model = (_k = (_j = streamResult.model) !== null && _j !== void 0 ? _j : (0, llm_response_meta_util_1.resolveLlmModelNameFromResponseMeta)(responseMeta)) !== null && _k !== void 0 ? _k : null;
    const rawStreamedText = streamedRaw.trim();
    const rawResultText = ((_l = streamResult.content) !== null && _l !== void 0 ? _l : '').trim();
    const finalized = (0, summarize_prose_stream_util_1.finalizeSummarizeProseStreamAfterLlm)({
        session: proseSession,
        rawStreamedText,
        rawResultText,
    });
    const summaryText = finalized.userMarkdown;
    recorder === null || recorder === void 0 ? void 0 : recorder.recordLlm(endName, Object.assign({ summaryTextLength: summaryText.length, summaryText: (0, page_action_run_audit_util_1.summarizeTextForAudit)(summaryText, 4000), model, promptTokens: (_m = usage === null || usage === void 0 ? void 0 : usage.promptTokens) !== null && _m !== void 0 ? _m : null, completionTokens: (_o = usage === null || usage === void 0 ? void 0 : usage.completionTokens) !== null && _o !== void 0 ? _o : null, delivery: 'prose_stream', deltaCount }, (0, page_action_run_audit_util_1.buildLlmOutputStepAudit)({
        assistantText: rawResultText || rawStreamedText,
        userFacingText: summaryText,
    })));
    (0, page_action_run_debug_util_1.logPageActionLlmResponse)({
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        phase: 'prose_stream',
        model,
        promptTokens: (_p = usage === null || usage === void 0 ? void 0 : usage.promptTokens) !== null && _p !== void 0 ? _p : null,
        completionTokens: (_q = usage === null || usage === void 0 ? void 0 : usage.completionTokens) !== null && _q !== void 0 ? _q : null,
        detail: { deltaCount, summaryTextLength: summaryText.length },
    });
    return {
        summaryText,
        model,
        promptTokens: (_r = usage === null || usage === void 0 ? void 0 : usage.promptTokens) !== null && _r !== void 0 ? _r : null,
        completionTokens: (_s = usage === null || usage === void 0 ? void 0 : usage.completionTokens) !== null && _s !== void 0 ? _s : null,
        deltaCount,
    };
}
exports.executePageActionProseStream = executePageActionProseStream;
//# sourceMappingURL=page-action-prose-stream.util.js.map