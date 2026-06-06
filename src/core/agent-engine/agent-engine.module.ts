import { Module, forwardRef } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { IntentModule } from '../intent/intent.module';
import { SkillModule } from '../skill/skill.module';
import { PromptModule } from '../prompt/prompt.module';
import { ToolEngineModule } from '../tool-engine/tool-engine.module';
import { ChatModule } from '../../modules/chat/chat.module';
import { AgentModule } from '../../modules/agent/agent.module';
import { AgentEngineService } from './engine/agent-engine.service';
import { AgentLangGraphRunner } from './engine/main/agent-lang-graph.runner';
import { AgentRunLifecycleService } from './engine/main/agent-run-lifecycle.service';
import { AgentRunSseEmitter } from './engine/main/agent-run-sse.emitter';
import { AgentSessionScopeService } from './engine/main/agent-session-scope.service';

@Module({
  imports: [
    LlmModule,
    IntentModule,
    SkillModule,
    PromptModule,
    ToolEngineModule,
    AgentModule,
    forwardRef(() => ChatModule),
  ],
  providers: [
    AgentRunSseEmitter,
    AgentSessionScopeService,
    AgentRunLifecycleService,
    AgentLangGraphRunner,
    AgentEngineService,
  ],
  exports: [AgentEngineService],
})
export class AgentEngineModule {}
