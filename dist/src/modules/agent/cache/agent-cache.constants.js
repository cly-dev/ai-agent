"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentRuntimeCacheTtlSec = void 0;
function readPositiveInt(envKey, defaultValue) {
    const raw = process.env[envKey];
    if (raw === undefined || raw === '') {
        return defaultValue;
    }
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : defaultValue;
}
function getAgentRuntimeCacheTtlSec() {
    return readPositiveInt('AGENT_RUNTIME_CACHE_TTL_SECONDS', 86400);
}
exports.getAgentRuntimeCacheTtlSec = getAgentRuntimeCacheTtlSec;
//# sourceMappingURL=agent-cache.constants.js.map