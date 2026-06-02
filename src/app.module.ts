import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import './core/env/load-env';
import { AdminPrefixJwtGuard } from './auth/admin-prefix-jwt.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatPublicCorsMiddleware } from './middleware/chat-public-cors.middleware';
import { LlmModule } from './core/llm/llm.module';
import { MemoryModule } from './core/memory/memory.module';
import { PromptModule } from './core/prompt/prompt.module';
import { PrismaModule } from './prisma/prisma.module';
import { AdminUserModule } from './modules/admin-user/admin-user.module';
import { AgentModule } from './modules/agent/agent.module';
import { AppClientModule } from './modules/app-client/app-client.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { ChatModule } from './modules/chat/chat.module';
import { ChatController } from './modules/chat/chat.controller';
import { MessageModule } from './modules/message/message.module';
import { MessageController } from './modules/message/message.controller';
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

@Module({
  imports: [
    LlmModule,
    MemoryModule,
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
    AgentModule,
    ChatModule,
    MessageModule,
    ToolModule,
    MessageTurnModule,
    AgentRunModule,
    SkillModule,
    IntegrationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ChatPublicCorsMiddleware,
    { provide: APP_GUARD, useClass: AdminPrefixJwtGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(ChatPublicCorsMiddleware)
      .forRoutes(ChatController, MessageController);
  }
}
