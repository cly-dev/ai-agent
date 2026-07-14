"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.intentRecallConfigKey = exports.llmModelConfigActiveKey = exports.CHAT_SSE_RELAY_CHANNEL = exports.SESSION_RUN_SUPERSEDE_CHANNEL = exports.sessionRunDrainLockKey = exports.sessionRunQueueKey = exports.sessionRunActiveKey = exports.sessionRunBindingsKey = exports.sessionRunGenerationKey = exports.pendingWriteConfirmationKey = exports.agentSkillCatalogScanPattern = exports.agentSkillCatalogKey = exports.agentToolCatalogKey = exports.agentHostToolCatalogKey = exports.sessionRuntimeKey = exports.sessionPrepareKey = exports.agentRuntimeKey = exports.sessionGoaCacheKey = exports.sessionContextKey = exports.userMemoryKey = void 0;
const memory_constants_1 = require("../shared/memory.constants");
function userMemoryKey(userId) {
    return `${memory_constants_1.REDIS_KEY_PREFIX}memory:user:${userId}`;
}
exports.userMemoryKey = userMemoryKey;
function sessionContextKey(sessionId) {
    return `${memory_constants_1.REDIS_KEY_PREFIX}context:session:${sessionId}`;
}
exports.sessionContextKey = sessionContextKey;
function sessionGoaCacheKey(sessionId) {
    return `${memory_constants_1.REDIS_KEY_PREFIX}goa:session:${sessionId}`;
}
exports.sessionGoaCacheKey = sessionGoaCacheKey;
function agentRuntimeKey(appClientId, agentId) {
    return `${memory_constants_1.REDIS_KEY_PREFIX}runtime:agent:${appClientId}:${agentId}`;
}
exports.agentRuntimeKey = agentRuntimeKey;
function sessionPrepareKey(sessionId) {
    return `${memory_constants_1.REDIS_KEY_PREFIX}prepare:session:${sessionId}`;
}
exports.sessionPrepareKey = sessionPrepareKey;
function sessionRuntimeKey(sessionId) {
    return `${memory_constants_1.REDIS_KEY_PREFIX}runtime:session:${sessionId}`;
}
exports.sessionRuntimeKey = sessionRuntimeKey;
function agentHostToolCatalogKey(appClientId, agentId) {
    return `${memory_constants_1.REDIS_KEY_PREFIX}runtime:agent-host-tools:${appClientId}:${agentId}`;
}
exports.agentHostToolCatalogKey = agentHostToolCatalogKey;
function agentToolCatalogKey(appClientId, agentId) {
    return `${memory_constants_1.REDIS_KEY_PREFIX}runtime:agent-tools:${appClientId}:${agentId}`;
}
exports.agentToolCatalogKey = agentToolCatalogKey;
function agentSkillCatalogKey(appClientId, agentId, roleId) {
    return `${memory_constants_1.REDIS_KEY_PREFIX}runtime:agent-skills:${appClientId}:${agentId}:${roleId}`;
}
exports.agentSkillCatalogKey = agentSkillCatalogKey;
function agentSkillCatalogScanPattern(appClientId, agentId) {
    return `${memory_constants_1.REDIS_KEY_PREFIX}runtime:agent-skills:${appClientId}:${agentId}:*`;
}
exports.agentSkillCatalogScanPattern = agentSkillCatalogScanPattern;
function pendingWriteConfirmationKey(sessionId) {
    return `${memory_constants_1.REDIS_KEY_PREFIX}pending-write:${sessionId}`;
}
exports.pendingWriteConfirmationKey = pendingWriteConfirmationKey;
function sessionRunGenerationKey(sessionId) {
    return `${memory_constants_1.REDIS_KEY_PREFIX}session-run:gen:${sessionId}`;
}
exports.sessionRunGenerationKey = sessionRunGenerationKey;
function sessionRunBindingsKey(sessionId) {
    return `${memory_constants_1.REDIS_KEY_PREFIX}session-run:bindings:${sessionId}`;
}
exports.sessionRunBindingsKey = sessionRunBindingsKey;
function sessionRunActiveKey(sessionId) {
    return `${memory_constants_1.REDIS_KEY_PREFIX}session-run:active:${sessionId}`;
}
exports.sessionRunActiveKey = sessionRunActiveKey;
function sessionRunQueueKey(sessionId) {
    return `${memory_constants_1.REDIS_KEY_PREFIX}session-run:queue:${sessionId}`;
}
exports.sessionRunQueueKey = sessionRunQueueKey;
function sessionRunDrainLockKey(sessionId) {
    return `${memory_constants_1.REDIS_KEY_PREFIX}session-run:drain-lock:${sessionId}`;
}
exports.sessionRunDrainLockKey = sessionRunDrainLockKey;
exports.SESSION_RUN_SUPERSEDE_CHANNEL = `${memory_constants_1.REDIS_KEY_PREFIX}session-run:supersede`;
exports.CHAT_SSE_RELAY_CHANNEL = `${memory_constants_1.REDIS_KEY_PREFIX}chat:sse-relay`;
function llmModelConfigActiveKey(kind) {
    return `${memory_constants_1.REDIS_KEY_PREFIX}config:llm:${kind}:active`;
}
exports.llmModelConfigActiveKey = llmModelConfigActiveKey;
function intentRecallConfigKey() {
    return `${memory_constants_1.REDIS_KEY_PREFIX}config:intent-recall:1`;
}
exports.intentRecallConfigKey = intentRecallConfigKey;
//# sourceMappingURL=redis-keys.js.map