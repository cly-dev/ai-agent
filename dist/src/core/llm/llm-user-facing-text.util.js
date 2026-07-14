"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLlmUserFacingTextFromAiMessage = exports.extractAiMessageContentChannel = void 0;
const llm_output_sanitize_util_1 = require("../agent-engine/engine/llm-output-sanitize.util");
function extractAiMessageContentChannel(message) {
    const { content } = message;
    if (typeof content === 'string') {
        return content;
    }
    if (Array.isArray(content)) {
        return content
            .map((item) => {
            var _a;
            return item && typeof item === 'object' && 'text' in item
                ? String((_a = item.text) !== null && _a !== void 0 ? _a : '')
                : '';
        })
            .join('');
    }
    return '';
}
exports.extractAiMessageContentChannel = extractAiMessageContentChannel;
function resolveLlmUserFacingTextFromAiMessage(message) {
    return (0, llm_output_sanitize_util_1.extractLlmUserFacingText)(extractAiMessageContentChannel(message));
}
exports.resolveLlmUserFacingTextFromAiMessage = resolveLlmUserFacingTextFromAiMessage;
//# sourceMappingURL=llm-user-facing-text.util.js.map