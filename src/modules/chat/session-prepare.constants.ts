function readPositiveInt(envKey: string, defaultValue: number): number {
  const raw = process.env[envKey];
  if (raw === undefined || raw === '') {
    return defaultValue;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : defaultValue;
}

/** Session prepare cache TTL (seconds). Default 5 minutes. */
export function getSessionPrepareCacheTtlSec(): number {
  return readPositiveInt('SESSION_PREPARE_CACHE_TTL_SECONDS', 300);
}
