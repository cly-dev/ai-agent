import { Module } from '@nestjs/common';
import './core/env/load-env';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LlmModule } from './core/llm/llm.module';
import { MemoryModule } from './core/memory/memory.module';
import { PromptModule } from './core/prompt/prompt.module';
import { PrismaModule } from './prisma/prisma.module';
import { AdminUserModule } from './modules/admin-user/admin-user.module';
import { AppClientModule } from './modules/app-client/app-client.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { ChatModule } from './modules/chat/chat.module';
import { MessageModule } from './modules/message/message.module';
import { SkillModule } from './modules/skill/skill.module';
import { ToolModule } from './modules/tool/tool.module';
import { UserModule } from './modules/user/user.module';
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
    ChatModule,
    MessageModule,
    ToolModule,
    SkillModule,
    IntegrationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
