import { Module } from '@nestjs/common';
import { OutboundHttpModule } from '../../core/outbound-http/outbound-http.module';
import { AuthModule } from '../../auth/auth.module';
import { LlmModule } from '../../core/llm/llm.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PageAgentController } from './page-agent.controller';
import { PageAgentProxyService } from './page-agent-proxy.service';

@Module({
  imports: [OutboundHttpModule, PrismaModule, AuthModule, LlmModule],
  controllers: [PageAgentController],
  providers: [PageAgentProxyService],
  exports: [PageAgentProxyService],
})
export class PageAgentModule {}
