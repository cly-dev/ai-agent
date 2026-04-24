import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AgentEngineModule } from '../../core/agent-engine/agent-engine.module';
import { LlmModule } from '../../core/llm/llm.module';
import { PromptModule } from '../../core/prompt/prompt.module';
import { ChatModule } from '../chat/chat.module';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => ChatModule),
    LlmModule,
    PromptModule,
    AgentEngineModule,
  ],
  providers: [MessageService],
  controllers: [MessageController],
  exports: [MessageService],
})
export class MessageModule {}
