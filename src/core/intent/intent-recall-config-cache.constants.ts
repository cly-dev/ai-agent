function readPositiveInt(envKey: string, defaultValue: number): number {
  const raw = process.env[envKey];
  if (raw === undefined || raw === '') {
    return defaultValue;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : defaultValue;
}

export function getIntentRecallConfigCacheTtlSec(): number {
  return readPositiveInt('INTENT_RECALL_CONFIG_CACHE_TTL_SECONDS', 3600);
}
