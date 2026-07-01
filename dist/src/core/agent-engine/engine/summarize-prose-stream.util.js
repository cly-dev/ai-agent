"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizeSummarizeProseStreamAfterLlm = exports.createSummarizeProseStreamSession = void 0;
const message_blocks_util_1 = require("./message/message-blocks.util");
const llm_output_sanitize_util_1 = require("./llm-output-sanitize.util");
const llm_stream_router_util_1 = require("./llm-stream-router.util");
function shouldStopProseStreamForBlocksProtocol(state) {
    if (state.mode === 'buffer' || state.mode === 'json_text') {
        return true;
    }
    return (0, message_blocks_util_1.looksLikeBlocksJsonOutput)(state.messageText);
}
function createSummarizeProseStreamSession(callbacks) {
    let streamRouter = (0, llm_stream_router_util_1.createLlmStreamRouterState)();
    let summarizeState = (0, message_blocks_util_1.createSummarizeMessageStreamState)();
    let sanitizedEmitted = '';
    let messageDeltaEmitted = false;
    let proseStreamSuperseded = false;
    const emitProseProgress = (state) => {
        if (proseStreamSuperseded) {
            return;
        }
        const proseSnapshot = (0, message_blocks_util_1.summarizeStreamedProseFromState)(state);
        if (!proseSnapshot) {
            return;
        }
        const next = (0, message_blocks_util_1.nextSanitizedSummarizeStreamDelta)(proseSnapshot, sanitizedEmitted);
        sanitizedEmitted = next.emitted;
        if (!next.delta) {
            return;
        }
        messageDeltaEmitted = true;
        callbacks.onProseDelta(next.delta);
    };
    const markProseStreamSuperseded = (state) => {
        if (proseStreamSuperseded) {
            return;
        }
        if (!shouldStopProseStreamForBlocksProtocol(state)) {
            return;
        }
        proseStreamSuperseded = true;
    };
    const replayRoutedMessage = (routedMessage) => {
        if (proseStreamSuperseded) {
            return;
        }
        let replayState = (0, message_blocks_util_1.createSummarizeMessageStreamState)();
        for (const ch of routedMessage) {
            const processed = (0, message_blocks_util_1.processSummarizeMessageStreamChunk)(replayState, ch);
            replayState = processed.state;
            markProseStreamSuperseded(replayState);
            if (proseStreamSuperseded) {
                break;
            }
            if (processed.delta) {
                emitProseProgress(replayState);
            }
        }
        summarizeState = replayState;
    };
    return {
        get sanitizedEmitted() {
            return sanitizedEmitted;
        },
        get messageDeltaEmitted() {
            return messageDeltaEmitted;
        },
        get proseStreamSuperseded() {
            return proseStreamSuperseded;
        },
        ingestLlmDelta(contentDelta) {
            var _a;
            if (!contentDelta || proseStreamSuperseded) {
                return;
            }
            const routed = (0, llm_stream_router_util_1.routeLlmStreamChunk)(streamRouter, contentDelta);
            streamRouter = routed.state;
            if (routed.think) {
                (_a = callbacks.onThinkDelta) === null || _a === void 0 ? void 0 : _a.call(callbacks, routed.think);
            }
            if (!routed.message) {
                return;
            }
            const processed = (0, message_blocks_util_1.processSummarizeMessageStreamChunk)(summarizeState, routed.message);
            summarizeState = processed.state;
            markProseStreamSuperseded(summarizeState);
            if (proseStreamSuperseded || !processed.delta) {
                return;
            }
            emitProseProgress(summarizeState);
        },
        replayRoutedMessage,
        resolveUserMarkdown(input) {
            var _a, _b, _c;
            const llmFinal = (_b = (_a = input.llmFinal) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
            const routedMessage = ((_c = input.routedMessage) === null || _c === void 0 ? void 0 : _c.trim()) ||
                (llmFinal ? (0, llm_stream_router_util_1.extractRoutedMessageFromLlmText)(llmFinal) : '');
            if (!messageDeltaEmitted && routedMessage) {
                replayRoutedMessage(routedMessage);
            }
            const fromState = (0, message_blocks_util_1.sanitizeSummarizeUserFacingProse)((0, llm_output_sanitize_util_1.sanitizeLlmFinalOutput)((0, message_blocks_util_1.summarizeStreamedProseFromState)(summarizeState))).trim();
            if (fromState) {
                return fromState;
            }
            if (sanitizedEmitted.trim()) {
                return (0, message_blocks_util_1.sanitizeSummarizeUserFacingProse)(sanitizedEmitted).trim();
            }
            return (0, message_blocks_util_1.sanitizeSummarizeUserFacingProse)((0, llm_output_sanitize_util_1.sanitizeLlmFinalOutput)(routedMessage || llmFinal)).trim();
        },
    };
}
exports.createSummarizeProseStreamSession = createSummarizeProseStreamSession;
function finalizeSummarizeProseStreamAfterLlm(input) {
    var _a;
    const rawStreamedText = input.rawStreamedText.trim();
    const rawResultText = input.rawResultText.trim();
    const rawLlmSource = rawStreamedText || rawResultText;
    const routedMessage = rawLlmSource
        ? (0, llm_stream_router_util_1.extractRoutedMessageFromLlmText)(rawLlmSource)
        : '';
    if (!input.session.messageDeltaEmitted && routedMessage) {
        (_a = input.onReplay) === null || _a === void 0 ? void 0 : _a.call(input, rawStreamedText ? 'buffer_or_json_no_delta' : 'invoke_fallback');
    }
    const userMarkdown = input.session.resolveUserMarkdown({
        llmFinal: rawLlmSource,
        routedMessage,
    });
    return { userMarkdown, routedMessage, rawLlmSource };
}
exports.finalizeSummarizeProseStreamAfterLlm = finalizeSummarizeProseStreamAfterLlm;
//# sourceMappingURL=summarize-prose-stream.util.js.map