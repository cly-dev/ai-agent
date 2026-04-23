import { Global, Module } from '@nestjs/common';
import { RedisConnectionService } from './redis/redis-connection.service';
import { SessionContextStore } from './session-context.store';
import { UserMemoryStore } from './user-memory.store';

/**
 * Redis 用户记忆与会话上下文（`src/core/memory`）。
 *
 * 环境变量（任选一种连接方式）：
 * - `REDIS_URL` — 推荐，如 `redis://localhost:6379`
 * - 或 `REDIS_HOST`，可选 `REDIS_PORT`（默认 6379）、`REDIS_PASSWORD`、`REDIS_DB`
 * - `MEMORY_USER_TTL_SECONDS` — 用户记忆默认 TTL（秒），`0` 表示不过期
 * - `MEMORY_SESSION_TTL_SECONDS` — 会话上下文默认 TTL（秒），默认 604800（7 天）
 *
 * 未配置 Redis 时模块仍加载，`get*` 返回 `null`，`set/delete` 抛 `503`。
 */
@Global()
@Module({
  providers: [RedisConnectionService, UserMemoryStore, SessionContextStore],
  exports: [RedisConnectionService, UserMemoryStore, SessionContextStore],
})
export class MemoryModule {}
