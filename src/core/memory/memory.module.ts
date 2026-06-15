import { Global, Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { PromptModule } from '../prompt/prompt.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisConnectionService } from './redis/redis-connection.service';
import { SessionContextStore } from './context/session-context.store';
import { UserMemoryStore } from './user/user-memory.store';
import { SessionHistoryCompressionService } from './context/session-history-compression.service';
import { SessionMessageContextSyncService } from './context/session-message-context-sync.service';
import { SessionGoaStore } from './goa/session-goa.store';
import { SessionGoaReplayService } from './goa/session-goa-replay.service';
import { SessionGoaService } from './goa/session-goa.service';
import { SessionResumeGateService } from './resume/session-resume-gate.service';
import { SessionTaskResumeFollowUpService } from './resume/session-task-resume-followup.service';

/**
 * Redis 用户记忆与会话上下文（`src/core/memory`）。
 *
 * GOA 记忆：PostgreSQL `SessionGoaMemory` 权威 + Redis `goa:session:{id}` 读缓存。
 * 会话对话：Redis `context:session:{id}`（turns + 历史压缩）。
 *
 * 设计说明：`docs/working-memory.md`
 */
@Global()
@Module({
  imports: [LlmModule, PromptModule, PrismaModule],
  providers: [
    RedisConnectionService,
    UserMemoryStore,
    SessionContextStore,
    SessionGoaReplayService,
    SessionGoaStore,
    SessionGoaService,
    SessionResumeGateService,
    SessionTaskResumeFollowUpService,
    SessionHistoryCompressionService,
    SessionMessageContextSyncService,
  ],
  exports: [
    RedisConnectionService,
    UserMemoryStore,
    SessionContextStore,
    SessionGoaReplayService,
    SessionGoaStore,
    SessionGoaService,
    SessionResumeGateService,
    SessionTaskResumeFollowUpService,
    SessionHistoryCompressionService,
    SessionMessageContextSyncService,
  ],
})
export class MemoryModule {}
