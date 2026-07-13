"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildUnsupportedIntentGuidance = exports.buildIntentClarificationGuidance = exports.isUserIntentClear = exports.normalizeUserMessageKey = void 0;
function normalizeUserMessageKey(userMessage) {
    return userMessage.trim().toLowerCase().replace(/\s+/g, ' ');
}
exports.normalizeUserMessageKey = normalizeUserMessageKey;
function isUserIntentClear(userMessage) {
    const trimmed = userMessage.trim();
    if (trimmed.length < 2) {
        return false;
    }
    return /[\p{L}\p{N}]/u.test(trimmed);
}
exports.isUserIntentClear = isUserIntentClear;
function buildIntentClarificationGuidance(userMessage) {
    const trimmed = userMessage.trim();
    if (trimmed.length === 0) {
        return '请先描述你的问题或希望完成的操作。';
    }
    return '你的描述还不够明确，请说明具体场景、对象或你希望完成的操作，我再继续处理。';
}
exports.buildIntentClarificationGuidance = buildIntentClarificationGuidance;
function buildUnsupportedIntentGuidance() {
    return '当前问题未匹配到系统支持的工具能力范围，暂无法处理该请求。你可以换个与已接入业务相关的问题试试。';
}
exports.buildUnsupportedIntentGuidance = buildUnsupportedIntentGuidance;
//# sourceMappingURL=intent-scope.util.js.map