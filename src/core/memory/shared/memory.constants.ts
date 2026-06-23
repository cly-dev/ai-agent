/** Redis 键统一前缀，与设计文档一致 */
export const REDIS_KEY_PREFIX = 'agent:';

/** 用户记忆默认 TTL（秒）。`0` 表示不过期。可由 `MEMORY_USER_TTL_SECONDS` 覆盖。 */
export function getDefaultUserMemoryTtlSec(): number {
  const raw = process.env.MEMORY_USER_TTL_SECONDS;
  if (raw === undefined || raw === '' || raw === '0') {
    return 0;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * 会话上下文默认 TTL（秒），必须为正数。
 * 可由 `MEMORY_SESSION_TTL_SECONDS` 覆盖；非法值回退 7 天。
 */
export function getDefaultSessionContextTtlSec(): number {
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

function readPositiveInt(
  envKey: string,
  defaultValue: number,
): number {
  const raw = process.env[envKey];
  if (raw === undefined || raw === '') {
    return defaultValue;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : defaultValue;
}

/** 超过该轮次数（turn 条数）时触发压缩，默认 24。 */
export function getSessionHistoryCompressAfterTurns(): number {
  return readPositiveInt('SESSION_HISTORY_COMPRESS_AFTER_TURNS', 24);
}

/** 压缩后仍保留的最近轮次原文条数，默认 12。 */
export function getSessionHistoryKeepRecentTurns(): number {
  return readPositiveInt('SESSION_HISTORY_KEEP_RECENT_TURNS', 12);
}

/** 压缩 LLM 输出摘要 max_tokens，默认 768。 */
export function getSessionHistoryCompressMaxSummaryTokens(): number {
  return readPositiveInt('SESSION_HISTORY_COMPRESS_MAX_SUMMARY_TOKENS', 768);
}

/** 送入压缩 LLM 的 transcript 估算 token 上限，默认 6000。 */
export function getSessionHistoryCompressMaxInputTokens(): number {
  return readPositiveInt('SESSION_HISTORY_COMPRESS_MAX_INPUT_TOKENS', 6000);
}
