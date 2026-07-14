"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.degradeInvokeContextBlockText = exports.degradeTaggedContextJsonMessage = exports.truncateJsonStringFields = void 0;
const text_degrade_util_1 = require("./text-degrade.util");
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function truncateJsonStringFields(value, maxStringChars) {
    if (typeof value === 'string') {
        if (value.length <= maxStringChars) {
            return value;
        }
        return (0, text_degrade_util_1.excerptText)(value, maxStringChars);
    }
    if (Array.isArray(value)) {
        return value.map((item) => truncateJsonStringFields(item, maxStringChars));
    }
    if (isRecord(value)) {
        const out = {};
        for (const [key, nested] of Object.entries(value)) {
            out[key] = truncateJsonStringFields(nested, maxStringChars);
        }
        return out;
    }
    return value;
}
exports.truncateJsonStringFields = truncateJsonStringFields;
const CONTEXT_OPEN = '<context>';
const CONTEXT_CLOSE = '</context>';
function maxStringCharsForLevel(level) {
    if (level === 1) {
        return 2500;
    }
    if (level === 2) {
        return 1200;
    }
    return 400;
}
function degradeTaggedContextJsonMessage(text, level) {
    const openIdx = text.indexOf(CONTEXT_OPEN);
    const closeIdx = text.indexOf(CONTEXT_CLOSE);
    if (openIdx < 0 || closeIdx <= openIdx) {
        return (0, text_degrade_util_1.excerptText)(text, level === 1 ? 3000 : level === 2 ? 1500 : 800);
    }
    const innerStart = openIdx + CONTEXT_OPEN.length;
    const rawJson = text.slice(innerStart, closeIdx).trim();
    try {
        const parsed = JSON.parse(rawJson);
        const truncated = truncateJsonStringFields(parsed, maxStringCharsForLevel(level));
        const nextContext = `${CONTEXT_OPEN}\n${JSON.stringify(truncated)}\n${CONTEXT_CLOSE}`;
        const rebuilt = text.slice(0, openIdx) + nextContext + text.slice(closeIdx + CONTEXT_CLOSE.length);
        if (rebuilt.length > 12000 && level >= 2) {
            return (0, text_degrade_util_1.excerptText)(rebuilt, 10000);
        }
        return rebuilt.trim();
    }
    catch (_a) {
        return (0, text_degrade_util_1.excerptText)(text, level === 1 ? 3000 : level === 2 ? 1500 : 800);
    }
}
exports.degradeTaggedContextJsonMessage = degradeTaggedContextJsonMessage;
function degradeInvokeContextBlockText(text, level) {
    const wrapped = text.includes(CONTEXT_OPEN) ? text : `${CONTEXT_OPEN}\n${text}\n${CONTEXT_CLOSE}`;
    return degradeTaggedContextJsonMessage(wrapped, level);
}
exports.degradeInvokeContextBlockText = degradeInvokeContextBlockText;
//# sourceMappingURL=context-json-degrade.util.js.map