import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PromptModule } from '../../core/prompt/prompt.module';
import { RuntimeCacheModule } from '../../core/runtime-cache/runtime-cache.module';
import { SessionRunModule } from '../../core/session-run/session-run.module';
import { SkillModule } from '../../core/skill/skill.module';
import { AgentModule } from '../agent/agent.module';
import { MessageModule } from '../message/message.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { SessionPrepareService } from './session-prepare.service';
import { SessionPrepareStore } from './session-prepare.store';
import { SessionRuntimeResolverService } from './session-runtime-resolver.service';
import { SessionRuntimeCacheHooksService } from './session-runtime-cache-hooks.service';
import { ChatEventsModule } from './chat-events.module';
import { ChatSessionRunBridgeModule } from './chat-session-run-bridge.module';
import { AgentAutoSelectService } from './agent-auto-select.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [
    AuthModule,
    RuntimeCacheModule,
    ChatEventsModule,
    ChatSessionRunBridgeModule,
    forwardRef(() => AgentModule),
    SkillModule,
    PromptModule,
    forwardRef(() => MessageModule),
    forwardRef(() => SessionRunModule),
  ],
  providers: [
    ChatService,
    SessionPrepareStore,
    SessionRuntimeResolverService,
    SessionPrepareService,
    SessionRuntimeCacheHooksService,
    {
      provide: AgentAutoSelectService,
      useFactory: (prisma: PrismaService) => new AgentAutoSelectService(prisma),
      inject: [PrismaService],
    },
  ],
  controllers: [ChatController],
  exports: [
    ChatService,
    ChatEventsModule,
    ChatSessionRunBridgeModule,
    SessionPrepareStore,
    SessionPrepareService,
    SessionRuntimeResolverService,
  ],
})
export class ChatModule {}
