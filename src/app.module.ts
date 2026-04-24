import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import './core/env/load-env';
import { AdminPrefixJwtGuard } from './auth/admin-prefix-jwt.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LlmModule } from './core/llm/llm.module';
import { MemoryModule } from './core/memory/memory.module';
import { PromptModule } from './core/prompt/prompt.module';
import { PrismaModule } from './prisma/prisma.module';
import { AdminUserModule } from './modules/admin-user/admin-user.module';
import { AgentModule } from './modules/agent/agent.module';
import { AppClientModule } from './modules/app-client/app-client.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { ChatModule } from './modules/chat/chat.module';
import { MessageModule } from './modules/message/message.module';
import { SkillModule } from './modules/skill/skill.module';
import { ToolModule } from './modules/tool/tool.module';
import { UserModule } from './modules/user/user.module';
import { UserAppModule } from './modules/user-app/user-app.module';
import { AuthModule } from './auth/auth.module';

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
    AgentModule,
    ChatModule,
    MessageModule,
    ToolModule,
    SkillModule,
    IntegrationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: AdminPrefixJwtGuard },
  ],
})
export class AppModule {}
