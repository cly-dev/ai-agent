"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readAppClientAuthTimeoutMs = exports.readPageAgentProxyTimeoutMs = exports.readIntegrationProbeTimeoutMs = exports.readToolDefaultTimeoutMs = exports.readLlmEmbeddingTimeoutMs = exports.readLlmOutboundTimeoutMs = void 0;
const DEFAULT_LLM_OUTBOUND_TIMEOUT_MS = 120000;
const DEFAULT_LLM_EMBEDDING_TIMEOUT_MS = 30000;
const DEFAULT_TOOL_TIMEOUT_MS = 10000;
const DEFAULT_INTEGRATION_PROBE_TIMEOUT_MS = 10000;
const DEFAULT_PAGE_AGENT_PROXY_TIMEOUT_MS = 60000;
const DEFAULT_APP_CLIENT_AUTH_TIMEOUT_MS = 15000;
function readPositiveIntEnv(name, fallback) {
    var _a;
    const raw = (_a = process.env[name]) === null || _a === void 0 ? void 0 : _a.trim();
    if (!raw) {
        return fallback;
    }
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
function readLlmOutboundTimeoutMs() {
    return readPositiveIntEnv('LLM_OUTBOUND_TIMEOUT_MS', DEFAULT_LLM_OUTBOUND_TIMEOUT_MS);
}
exports.readLlmOutboundTimeoutMs = readLlmOutboundTimeoutMs;
function readLlmEmbeddingTimeoutMs() {
    return readPositiveIntEnv('LLM_EMBEDDING_TIMEOUT_MS', DEFAULT_LLM_EMBEDDING_TIMEOUT_MS);
}
exports.readLlmEmbeddingTimeoutMs = readLlmEmbeddingTimeoutMs;
function readToolDefaultTimeoutMs() {
    return readPositiveIntEnv('TOOL_DEFAULT_TIMEOUT_MS', DEFAULT_TOOL_TIMEOUT_MS);
}
exports.readToolDefaultTimeoutMs = readToolDefaultTimeoutMs;
function readIntegrationProbeTimeoutMs() {
    return readPositiveIntEnv('INTEGRATION_PROBE_TIMEOUT_MS', DEFAULT_INTEGRATION_PROBE_TIMEOUT_MS);
}
exports.readIntegrationProbeTimeoutMs = readIntegrationProbeTimeoutMs;
function readPageAgentProxyTimeoutMs() {
    return readPositiveIntEnv('PAGE_AGENT_PROXY_TIMEOUT_MS', DEFAULT_PAGE_AGENT_PROXY_TIMEOUT_MS);
}
exports.readPageAgentProxyTimeoutMs = readPageAgentProxyTimeoutMs;
function readAppClientAuthTimeoutMs() {
    return readPositiveIntEnv('APP_CLIENT_AUTH_TIMEOUT_MS', DEFAULT_APP_CLIENT_AUTH_TIMEOUT_MS);
}
exports.readAppClientAuthTimeoutMs = readAppClientAuthTimeoutMs;
//# sourceMappingURL=outbound-http.policy.util.js.map