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
import { RunAssistantArtifactStore } from './engine/main/run-assistant-artifact.store';
import { RunAssistantMessagePersistService } from './engine/main/run-assistant-message-persist.service';
import { AgentSessionScopeService } from './engine/main/agent-session-scope.service';
import { SessionToolPrepareCacheService } from './engine/main/session-tool-prepare-cache.service';

@Module({
  imports: [
    LlmModule,
    IntentModule,
    SkillModule,
    PromptModule,
    ToolEngineModule,
    forwardRef(() => AgentModule),
    forwardRef(() => ChatModule),
  ],
  providers: [
    RunAssistantArtifactStore,
    RunAssistantMessagePersistService,
    AgentRunSseEmitter,
    AgentSessionScopeService,
    SessionToolPrepareCacheService,
    AgentRunLifecycleService,
    AgentLangGraphRunner,
    AgentEngineService,
  ],
  exports: [
    AgentEngineService,
    AgentSessionScopeService,
    SessionToolPrepareCacheService,
  ],
})
export class AgentEngineModule {}
