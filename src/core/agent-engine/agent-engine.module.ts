import { Module, forwardRef } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { PromptModule } from '../prompt/prompt.module';
import { ToolEngineModule } from '../tool-engine/tool-engine.module';
import { ChatModule } from '../../modules/chat/chat.module';
import { AgentEngineService } from './agent-engine.service';

@Module({
  imports: [LlmModule, PromptModule, ToolEngineModule, forwardRef(() => ChatModule)],
  providers: [AgentEngineService],
  exports: [AgentEngineService],
})
export class AgentEngineModule {}