"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeLlmFinalOutput = exports.sanitizeTextForStorage = exports.extractLlmUserFacingText = exports.stripLlmThinkBlocks = void 0;
const THINK_BLOCK_RE = /<think>[\s\S]*?<\/redacted_thinking>/gi;
const UNCLOSED_THINK_BLOCK_RE = /<think>[\s\S]*/gi;
const ORPHAN_THINK_TAG_RE = /<\/?redacted_thinking>/gi;
const MESSAGE_BLOCK_RE = /<message>([\s\S]*?)<\/message>/i;
const TOOL_CALLS_BLOCK_RE = /<tool_calls>[\s\S]*?<\/tool_calls>/gi;
function stripLlmThinkBlocks(text) {
    return text
        .replace(THINK_BLOCK_RE, '')
        .replace(UNCLOSED_THINK_BLOCK_RE, '')
        .replace(ORPHAN_THINK_TAG_RE, '')
        .trim();
}
exports.stripLlmThinkBlocks = stripLlmThinkBlocks;
function extractLlmUserFacingText(text) {
    const trimmed = text.trim();
    if (!trimmed) {
        return '';
    }
    const messageMatch = MESSAGE_BLOCK_RE.exec(trimmed);
    if (messageMatch === null || messageMatch === void 0 ? void 0 : messageMatch[1]) {
        return stripLlmThinkBlocks(messageMatch[1]);
    }
    return stripLlmThinkBlocks(trimmed)
        .replace(TOOL_CALLS_BLOCK_RE, '')
        .trim();
}
exports.extractLlmUserFacingText = extractLlmUserFacingText;
function sanitizeTextForStorage(text) {
    return extractLlmUserFacingText(text);
}
exports.sanitizeTextForStorage = sanitizeTextForStorage;
function sanitizeLlmFinalOutput(value) {
    return sanitizeTextForStorage(value);
}
exports.sanitizeLlmFinalOutput = sanitizeLlmFinalOutput;
//# sourceMappingURL=llm-output-sanitize.util.js.map