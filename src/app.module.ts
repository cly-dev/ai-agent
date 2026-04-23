import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LlmModule } from './core/llm/llm.module';
import { PrismaModule } from './prisma/prisma.module';
import { AdminUserModule } from './modules/admin-user/admin-user.module';
import { AppClientModule } from './modules/app-client/app-client.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { SkillModule } from './modules/skill/skill.module';
import { ToolModule } from './modules/tool/tool.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    LlmModule,
    PrismaModule,
    AuthModule,
    AdminUserModule,
    AppClientModule,
    UserModule,
    ToolModule,
    SkillModule,
    IntegrationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
