"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLlmModelNameFromResponseMeta = exports.extractLlmTokenUsageFromResponseMeta = void 0;
function pickInt(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.max(0, Math.floor(value));
    }
    return null;
}
function extractLlmTokenUsageFromResponseMeta(responseMeta) {
    var _a, _b, _c, _d, _e, _f;
    if (!responseMeta) {
        return null;
    }
    const raw = (_b = (_a = responseMeta.token_usage) !== null && _a !== void 0 ? _a : responseMeta.usage) !== null && _b !== void 0 ? _b : responseMeta.tokenUsage;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return null;
    }
    const row = raw;
    const prompt = (_d = (_c = pickInt(row.prompt_tokens)) !== null && _c !== void 0 ? _c : pickInt(row.input_tokens)) !== null && _d !== void 0 ? _d : pickInt(row.promptTokens);
    const completion = (_f = (_e = pickInt(row.completion_tokens)) !== null && _e !== void 0 ? _e : pickInt(row.output_tokens)) !== null && _f !== void 0 ? _f : pickInt(row.completionTokens);
    if (prompt == null && completion == null) {
        return null;
    }
    return {
        promptTokens: prompt !== null && prompt !== void 0 ? prompt : 0,
        completionTokens: completion !== null && completion !== void 0 ? completion : 0,
    };
}
exports.extractLlmTokenUsageFromResponseMeta = extractLlmTokenUsageFromResponseMeta;
function resolveLlmModelNameFromResponseMeta(responseMeta) {
    return typeof (responseMeta === null || responseMeta === void 0 ? void 0 : responseMeta.model_name) === 'string'
        ? responseMeta.model_name
        : null;
}
exports.resolveLlmModelNameFromResponseMeta = resolveLlmModelNameFromResponseMeta;
//# sourceMappingURL=llm-response-meta.util.js.map