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
