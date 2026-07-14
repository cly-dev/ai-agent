"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionHistoryCompressMaxInputTokens = exports.getSessionHistoryCompressMaxSummaryTokens = exports.getSessionHistoryKeepRecentTurns = exports.getSessionHistoryCompressAfterTurns = exports.getDefaultSessionContextTtlSec = exports.getDefaultUserMemoryTtlSec = exports.REDIS_KEY_PREFIX = void 0;
exports.REDIS_KEY_PREFIX = 'agent:';
function getDefaultUserMemoryTtlSec() {
    const raw = process.env.MEMORY_USER_TTL_SECONDS;
    if (raw === undefined || raw === '' || raw === '0') {
        return 0;
    }
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
}
exports.getDefaultUserMemoryTtlSec = getDefaultUserMemoryTtlSec;
function getDefaultSessionContextTtlSec() {
    const raw = process.env.MEMORY_SESSION_TTL_SECONDS;
    if (raw === undefined || raw === '') {
        return 604800;
    }
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n <= 0) {
        return 604800;
    }
    return n;
}
exports.getDefaultSessionContextTtlSec = getDefaultSessionContextTtlSec;
function readPositiveInt(envKey, defaultValue) {
    const raw = process.env[envKey];
    if (raw === undefined || raw === '') {
        return defaultValue;
    }
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : defaultValue;
}
function getSessionHistoryCompressAfterTurns() {
    return readPositiveInt('SESSION_HISTORY_COMPRESS_AFTER_TURNS', 24);
}
exports.getSessionHistoryCompressAfterTurns = getSessionHistoryCompressAfterTurns;
function getSessionHistoryKeepRecentTurns() {
    return readPositiveInt('SESSION_HISTORY_KEEP_RECENT_TURNS', 12);
}
exports.getSessionHistoryKeepRecentTurns = getSessionHistoryKeepRecentTurns;
function getSessionHistoryCompressMaxSummaryTokens() {
    return readPositiveInt('SESSION_HISTORY_COMPRESS_MAX_SUMMARY_TOKENS', 768);
}
exports.getSessionHistoryCompressMaxSummaryTokens = getSessionHistoryCompressMaxSummaryTokens;
function getSessionHistoryCompressMaxInputTokens() {
    return readPositiveInt('SESSION_HISTORY_COMPRESS_MAX_INPUT_TOKENS', 6000);
}
exports.getSessionHistoryCompressMaxInputTokens = getSessionHistoryCompressMaxInputTokens;
//# sourceMappingURL=memory.constants.js.map