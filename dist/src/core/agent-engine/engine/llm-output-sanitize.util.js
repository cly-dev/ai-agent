"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeLlmFinalOutput = exports.sanitizeTextForStorage = exports.extractLlmUserFacingText = exports.stripLlmThinkBlocks = void 0;
const llm_reasoning_block_tags_util_1 = require("../../llm/llm-reasoning-block-tags.util");
const MESSAGE_BLOCK_RE = /<message>([\s\S]*?)<\/message>/i;
const TOOL_CALLS_BLOCK_RE = /<tool_calls>[\s\S]*?<\/tool_calls>/gi;
let cachedPatterns = null;
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function buildReasoningStripPatterns() {
    const tags = (0, llm_reasoning_block_tags_util_1.loadLlmReasoningBlockTags)().map(escapeRegExp);
    const tagAlt = tags.join('|');
    return {
        thinkBlock: new RegExp(`<(?:${tagAlt})(?:\\s[^>]*)?>[\\s\\S]*?</(?:${tagAlt})(?:\\s[^>]*)?>`, 'gi'),
        thinkOpen: new RegExp(`<(?:${tagAlt})(?:\\s[^>]*)?>`, 'i'),
        thinkCloseTest: new RegExp(`</(?:${tagAlt})(?:\\s[^>]*)?>`, 'i'),
        thinkCloseAll: new RegExp(`</(?:${tagAlt})(?:\\s[^>]*)?>`, 'gi'),
        unclosedThinkBlock: new RegExp(`<(?:${tagAlt})(?:\\s[^>]*)?>[\\s\\S]*`, 'gi'),
        orphanThinkTag: new RegExp(`<\\/?(?:${tagAlt})(?:\\s[^>]*)?>`, 'gi'),
    };
}
function getReasoningStripPatterns() {
    if (!cachedPatterns) {
        cachedPatterns = buildReasoningStripPatterns();
    }
    return cachedPatterns;
}
function tailAfterLastConfiguredThinkClose(text, patterns) {
    var _a;
    let lastEnd = -1;
    for (const match of text.matchAll(patterns.thinkCloseAll)) {
        lastEnd = ((_a = match.index) !== null && _a !== void 0 ? _a : 0) + match[0].length;
    }
    return lastEnd >= 0 ? text.slice(lastEnd).trim() : '';
}
function recoverWhenThinkStripEmptied(raw) {
    const trimmed = raw.trim();
    if (!trimmed) {
        return '';
    }
    const patterns = getReasoningStripPatterns();
    const afterThinkClose = tailAfterLastConfiguredThinkClose(trimmed, patterns);
    if (afterThinkClose.length > 0) {
        return afterThinkClose;
    }
    if (patterns.thinkOpen.test(trimmed)) {
        return '';
    }
    return '';
}
function stripLlmThinkBlocks(text) {
    const patterns = getReasoningStripPatterns();
    let result = text.replace(patterns.thinkBlock, '');
    if (patterns.thinkOpen.test(result)) {
        result = result.replace(patterns.unclosedThinkBlock, '');
    }
    return result.replace(patterns.orphanThinkTag, '').trim();
}
exports.stripLlmThinkBlocks = stripLlmThinkBlocks;
function resolveUserFacingBody(source, options) {
    const raw = source.trim();
    if (!raw) {
        return '';
    }
    let body = stripLlmThinkBlocks(raw);
    if (!body.trim()) {
        body = recoverWhenThinkStripEmptied(raw);
    }
    if ((options === null || options === void 0 ? void 0 : options.stripToolCalls) !== false) {
        body = body.replace(TOOL_CALLS_BLOCK_RE, '').trim();
    }
    return body.trim();
}
function extractLlmUserFacingText(text) {
    const trimmed = text.trim();
    if (!trimmed) {
        return '';
    }
    const messageMatch = MESSAGE_BLOCK_RE.exec(trimmed);
    if (messageMatch === null || messageMatch === void 0 ? void 0 : messageMatch[1]) {
        return resolveUserFacingBody(messageMatch[1], { stripToolCalls: false });
    }
    return resolveUserFacingBody(trimmed);
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