import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AgentEngineModule } from '../../core/agent-engine/agent-engine.module';
import { LlmModule } from '../../core/llm/llm.module';
import { PromptModule } from '../../core/prompt/prompt.module';
import { ToolEngineModule } from '../../core/tool-engine/tool-engine.module';
import { ToolController } from './tool.controller';
import { ToolService } from './tool.service';

@Module({
  imports: [
    AuthModule,
    LlmModule,
    PromptModule,
    ToolEngineModule,
    forwardRef(() => AgentEngineModule),
  ],
  providers: [ToolService],
  controllers: [ToolController],
  exports: [ToolService],
})
export class ToolModule {}
