"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLlmModelConfigCacheTtlSec = void 0;
function readPositiveInt(envKey, defaultValue) {
    const raw = process.env[envKey];
    if (raw === undefined || raw === '') {
        return defaultValue;
    }
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : defaultValue;
}
function getLlmModelConfigCacheTtlSec() {
    return readPositiveInt('LLM_MODEL_CONFIG_CACHE_TTL_SECONDS', 3600);
}
exports.getLlmModelConfigCacheTtlSec = getLlmModelConfigCacheTtlSec;
//# sourceMappingURL=llm-model-config-cache.constants.js.map