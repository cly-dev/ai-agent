const DEFAULT_LLM_OUTBOUND_TIMEOUT_MS = 120_000;
const DEFAULT_LLM_EMBEDDING_TIMEOUT_MS = 30_000;
const DEFAULT_TOOL_TIMEOUT_MS = 10_000;
const DEFAULT_INTEGRATION_PROBE_TIMEOUT_MS = 10_000;
const DEFAULT_PAGE_AGENT_PROXY_TIMEOUT_MS = 60_000;
const DEFAULT_APP_CLIENT_AUTH_TIMEOUT_MS = 15_000;

function readPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function readLlmOutboundTimeoutMs(): number {
  return readPositiveIntEnv(
    'LLM_OUTBOUND_TIMEOUT_MS',
    DEFAULT_LLM_OUTBOUND_TIMEOUT_MS,
  );
}

export function readLlmEmbeddingTimeoutMs(): number {
  return readPositiveIntEnv(
    'LLM_EMBEDDING_TIMEOUT_MS',
    DEFAULT_LLM_EMBEDDING_TIMEOUT_MS,
  );
}

export function readToolDefaultTimeoutMs(): number {
  return readPositiveIntEnv('TOOL_DEFAULT_TIMEOUT_MS', DEFAULT_TOOL_TIMEOUT_MS);
}

export function readIntegrationProbeTimeoutMs(): number {
  return readPositiveIntEnv(
    'INTEGRATION_PROBE_TIMEOUT_MS',
    DEFAULT_INTEGRATION_PROBE_TIMEOUT_MS,
  );
}

export function readPageAgentProxyTimeoutMs(): number {
  return readPositiveIntEnv(
    'PAGE_AGENT_PROXY_TIMEOUT_MS',
    DEFAULT_PAGE_AGENT_PROXY_TIMEOUT_MS,
  );
}

export function readAppClientAuthTimeoutMs(): number {
  return readPositiveIntEnv(
    'APP_CLIENT_AUTH_TIMEOUT_MS',
    DEFAULT_APP_CLIENT_AUTH_TIMEOUT_MS,
  );
}
