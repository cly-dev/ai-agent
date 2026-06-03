function readPositiveInt(envKey: string, defaultValue: number): number {
  const raw = process.env[envKey];
  if (raw === undefined || raw === '') {
    return defaultValue;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : defaultValue;
}

/** Lazy agent runtime cache TTL (seconds). Default 24h; invalidation on write is primary. */
export function getAgentRuntimeCacheTtlSec(): number {
  return readPositiveInt('AGENT_RUNTIME_CACHE_TTL_SECONDS', 86400);
}
