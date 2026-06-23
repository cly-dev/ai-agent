import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PromptModule } from '../../core/prompt/prompt.module';
import { RuntimeCacheModule } from '../../core/runtime-cache/runtime-cache.module';
import { SkillModule } from '../../core/skill/skill.module';
import { AgentModule } from '../agent/agent.module';
import { MessageModule } from '../message/message.module';
import { ChatController } from './chat.controller';
import { ChatEventsService } from './chat-events.service';
import { ChatService } from './chat.service';
import { SessionPrepareService } from './session-prepare.service';
import { SessionPrepareStore } from './session-prepare.store';
import { SessionRuntimeCacheHooksService } from './session-runtime-cache-hooks.service';
import { PendingWriteConfirmationStore } from './pending-write-confirmation.store';

@Module({
  imports: [
    AuthModule,
    RuntimeCacheModule,
    forwardRef(() => AgentModule),
    SkillModule,
    PromptModule,
    forwardRef(() => MessageModule),
  ],
  providers: [
    ChatService,
    ChatEventsService,
    SessionPrepareStore,
    SessionPrepareService,
    SessionRuntimeCacheHooksService,
    PendingWriteConfirmationStore,
  ],
  controllers: [ChatController],
  exports: [
    ChatService,
    ChatEventsService,
    SessionPrepareStore,
    SessionPrepareService,
    PendingWriteConfirmationStore,
  ],
})
export class ChatModule {}
