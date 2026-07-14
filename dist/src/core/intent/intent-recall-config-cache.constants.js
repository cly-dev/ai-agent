"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIntentRecallConfigCacheTtlSec = void 0;
function readPositiveInt(envKey, defaultValue) {
    const raw = process.env[envKey];
    if (raw === undefined || raw === '') {
        return defaultValue;
    }
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : defaultValue;
}
function getIntentRecallConfigCacheTtlSec() {
    return readPositiveInt('INTENT_RECALL_CONFIG_CACHE_TTL_SECONDS', 3600);
}
exports.getIntentRecallConfigCacheTtlSec = getIntentRecallConfigCacheTtlSec;
//# sourceMappingURL=intent-recall-config-cache.constants.js.map