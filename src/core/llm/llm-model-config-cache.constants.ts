function readPositiveInt(envKey: string, defaultValue: number): number {
  const raw = process.env[envKey];
  if (raw === undefined || raw === '') {
    return defaultValue;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : defaultValue;
}

/** LlmModelConfig Redis TTL（秒）。管理端更新会主动 refresh；TTL 用于多实例与冷启动。 */
export function getLlmModelConfigCacheTtlSec(): number {
  return readPositiveInt('LLM_MODEL_CONFIG_CACHE_TTL_SECONDS', 3600);
}
