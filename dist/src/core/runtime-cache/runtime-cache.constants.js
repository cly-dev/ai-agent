"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_RUN_SCOPE_CACHE_ENTRIES = exports.getRunScopeCacheTtlMs = exports.getSessionRuntimeCacheTtlSec = exports.getRuntimeAgentCatalogTtlSec = void 0;
function readPositiveInt(envKey, defaultValue) {
    const raw = process.env[envKey];
    if (raw === undefined || raw === '') {
        return defaultValue;
    }
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : defaultValue;
}
function getRuntimeAgentCatalogTtlSec() {
    return readPositiveInt('RUNTIME_AGENT_CATALOG_TTL_SECONDS', 600);
}
exports.getRuntimeAgentCatalogTtlSec = getRuntimeAgentCatalogTtlSec;
function getSessionRuntimeCacheTtlSec() {
    const unified = process.env.SESSION_RUNTIME_CACHE_TTL_SECONDS;
    if (unified !== undefined && unified !== '') {
        return readPositiveInt('SESSION_RUNTIME_CACHE_TTL_SECONDS', 300);
    }
    return readPositiveInt('SESSION_PREPARE_CACHE_TTL_SECONDS', 300);
}
exports.getSessionRuntimeCacheTtlSec = getSessionRuntimeCacheTtlSec;
function getRunScopeCacheTtlMs() {
    return readPositiveInt('RUN_SCOPE_CACHE_TTL_MS', 600000);
}
exports.getRunScopeCacheTtlMs = getRunScopeCacheTtlMs;
exports.MAX_RUN_SCOPE_CACHE_ENTRIES = 256;
//# sourceMappingURL=runtime-cache.constants.js.map