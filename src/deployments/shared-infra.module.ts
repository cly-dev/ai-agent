import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { OutboundHttpModule } from '../core/outbound-http/outbound-http.module';
import { LlmModule } from '../core/llm/llm.module';
import { MemoryModule } from '../core/memory/memory.module';
import { RuntimeCacheModule } from '../core/runtime-cache/runtime-cache.module';
import { PromptModule } from '../core/prompt/prompt.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ApprovalModule } from '../core/approval/approval.module';

/** 各部署单元共享的基础设施（DB / Redis / LLM / Prompt / 审批内核）。 */
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 120,
    }),
    OutboundHttpModule,
    PrismaModule,
    MemoryModule,
    LlmModule,
    PromptModule,
    RuntimeCacheModule,
    AuthModule,
    ApprovalModule,
  ],
  exports: [
    ThrottlerModule,
    OutboundHttpModule,
    PrismaModule,
    MemoryModule,
    LlmModule,
    PromptModule,
    RuntimeCacheModule,
    AuthModule,
    ApprovalModule,
  ],
})
export class SharedInfraModule {}
