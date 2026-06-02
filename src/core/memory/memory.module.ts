import { Global, Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { PromptModule } from '../prompt/prompt.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisConnectionService } from './redis/redis-connection.service';
import { SessionContextStore } from './session-context.store';
import { UserMemoryStore } from './user-memory.store';
import { SessionHistoryCompressionService } from './session-history-compression.service';
import { WorkingMemoryService } from './working-memory.service';

/**
 * Redis 用户记忆与会话上下文（`src/core/memory`）。
 *
 * 环境变量（任选一种连接方式）：
 * - `REDIS_URL` — 推荐，如 `redis://localhost:6379`
 * - 或 `REDIS_HOST`，可选 `REDIS_PORT`（默认 6379）、`REDIS_PASSWORD`、`REDIS_DB`
 * - `MEMORY_USER_TTL_SECONDS` — 用户记忆默认 TTL（秒），`0` 表示不过期
 * - `MEMORY_SESSION_TTL_SECONDS` — 会话上下文默认 TTL（秒），默认 604800（7 天）
 * - `SESSION_HISTORY_COMPRESS` — 多轮历史压缩，`0` 关闭（默认开启）
 * - `SESSION_HISTORY_COMPRESS_AFTER_TURNS` — 超过多少条 turn 后压缩（默认 24）
 * - `SESSION_HISTORY_KEEP_RECENT_TURNS` — 保留最近原文条数（默认 12）
 * - `SESSION_HISTORY_TRIM_TURNS_AFTER_COMPRESS` — 压缩成功后软裁剪 Redis turns，`0` 关闭
 *
 * 设计说明见 `src/core/memory/session-history-compression.md`。
 *
 * 未配置 Redis 时模块仍加载，`get*` 返回 `null`，`set/delete` 抛 `503`。
 */
@Global()
@Module({
  imports: [LlmModule, PromptModule, PrismaModule],
  providers: [
    RedisConnectionService,
    UserMemoryStore,
    SessionContextStore,
    WorkingMemoryService,
    SessionHistoryCompressionService,
  ],
  exports: [
    RedisConnectionService,
    UserMemoryStore,
    SessionContextStore,
    WorkingMemoryService,
    SessionHistoryCompressionService,
  ],
})
export class MemoryModule {}
