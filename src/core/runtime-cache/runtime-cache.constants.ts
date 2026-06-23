function readPositiveInt(envKey: string, defaultValue: number): number {
  const raw = process.env[envKey];
  if (raw === undefined || raw === '') {
    return defaultValue;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : defaultValue;
}

/** L2 Agent 目录（host-tool catalog 等）TTL，秒。默认 10 分钟。 */
export function getRuntimeAgentCatalogTtlSec(): number {
  return readPositiveInt('RUNTIME_AGENT_CATALOG_TTL_SECONDS', 600);
}

/** L1 会话运行快照 TTL，秒。默认 5 分钟（兼容 SESSION_PREPARE_CACHE_TTL_SECONDS）。 */
export function getSessionRuntimeCacheTtlSec(): number {
  const unified = process.env.SESSION_RUNTIME_CACHE_TTL_SECONDS;
  if (unified !== undefined && unified !== '') {
    return readPositiveInt('SESSION_RUNTIME_CACHE_TTL_SECONDS', 300);
  }
  return readPositiveInt('SESSION_PREPARE_CACHE_TTL_SECONDS', 300);
}

/** L0 进程内 run / intent 缓存 TTL，毫秒。默认 10 分钟。 */
export function getRunScopeCacheTtlMs(): number {
  return readPositiveInt('RUN_SCOPE_CACHE_TTL_MS', 600_000);
}

export const MAX_RUN_SCOPE_CACHE_ENTRIES = 256;
