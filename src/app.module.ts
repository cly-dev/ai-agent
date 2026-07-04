import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import './core/env/load-env';
import { AdminPrefixJwtGuard } from './auth/admin-prefix-jwt.guard';
import { AdminRoleGuard } from './auth/admin-role.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LlmModule } from './core/llm/llm.module';
import { MemoryModule } from './core/memory/memory.module';
import { RuntimeCacheModule } from './core/runtime-cache/runtime-cache.module';
import { PromptModule } from './core/prompt/prompt.module';
import { PrismaModule } from './prisma/prisma.module';
import { AdminUserModule } from './modules/admin-user/admin-user.module';
import { AgentModule } from './modules/agent/agent.module';
import { AppClientModule } from './modules/app-client/app-client.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { ChatModule } from './modules/chat/chat.module';
import { MessageFeedbackModule } from './modules/message-feedback/message-feedback.module';
import { MessageModule } from './modules/message/message.module';
import { SkillModule } from './modules/skill/skill.module';
import { ToolModule } from './modules/tool/tool.module';
import { MessageTurnModule } from './modules/message-turn/message-turn.module';
import { AgentRunModule } from './modules/agent-run/agent-run.module';
import { UserModule } from './modules/user/user.module';
import { UserAppModule } from './modules/user-app/user-app.module';
import { AuthModule } from './auth/auth.module';
import { SessionModule } from './modules/session/session.module';
import { ToolCategoryModule } from './modules/tool-category/tool-category.module';
import { LlmModelConfigModule } from './modules/llm-model-config/llm-model-config.module';
import { PromptTemplateModule } from './modules/prompt-template/prompt-template.module';
import { RoleModule } from './modules/role/role.module';
import { HostToolModule } from './modules/host-tool/host-tool.module';
import { PageActionModule } from './modules/page-action/page-action.module';
import { PageAgentModule } from './modules/page-agent/page-agent.module';
import { ApprovalModule } from './core/approval/approval.module';
import { ApprovalModule as ApprovalInboxModule } from './modules/approval/approval.module';
import { WorkflowModule } from './modules/workflow/workflow.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 120,
    }),
    LlmModule,
    MemoryModule,
    RuntimeCacheModule,
    PromptModule,
    PrismaModule,
    AuthModule,
    AdminUserModule,
    AppClientModule,
    UserModule,
    UserAppModule,
    SessionModule,
    ToolCategoryModule,
    LlmModelConfigModule,
    PromptTemplateModule,
    RoleModule,
    HostToolModule,
    PageActionModule,
    PageAgentModule,
    ApprovalModule,
    ApprovalInboxModule,
    WorkflowModule,
    AgentModule,
    ChatModule,
    MessageModule,
    MessageFeedbackModule,
    ToolModule,
    MessageTurnModule,
    AgentRunModule,
    SkillModule,
    IntegrationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AdminPrefixJwtGuard },
    { provide: APP_GUARD, useClass: AdminRoleGuard },
  ],
})
export class AppModule {}
