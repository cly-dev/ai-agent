import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AgentEngineModule } from '../../core/agent-engine/agent-engine.module';
import { SessionRunModule } from '../../core/session-run/session-run.module';
import { ChatModule } from '../chat/chat.module';
import { MessageController } from './message.controller';
import { MessageFeedbackService } from './message-feedback.service';
import { MessageService } from './message.service';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => ChatModule),
    AgentEngineModule,
    SessionRunModule,
  ],
  providers: [MessageService, MessageFeedbackService],
  controllers: [MessageController],
  exports: [MessageService],
})
export class MessageModule {}
