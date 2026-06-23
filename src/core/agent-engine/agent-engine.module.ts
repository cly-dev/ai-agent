import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LlmModule } from '../llm/llm.module';
import { IntentModule } from '../intent/intent.module';
import { SkillModule } from '../skill/skill.module';
import { PromptModule } from '../prompt/prompt.module';
import { ToolEngineModule } from '../tool-engine/tool-engine.module';
import { ChatModule } from '../../modules/chat/chat.module';
import { AgentModule } from '../../modules/agent/agent.module';
import { HostToolModule } from '../../modules/host-tool/host-tool.module';
import { AgentEngineService } from './engine/agent-engine.service';
import { AgentLangGraphRunner } from './engine/main/runner/agent-lang-graph.runner';
import { AgentRunLifecycleService } from './engine/main/run/agent-run-lifecycle.service';
import { AgentRunSseEmitter } from './engine/main/run/agent-run-sse.emitter';
import { RunAssistantArtifactStore } from './engine/main/run/run-assistant-artifact.store';
import { RunAssistantMessagePersistService } from './engine/main/run/run-assistant-message-persist.service';
import { AgentSessionScopeService } from './engine/main/session/agent-session-scope.service';
import { RequestedSkillRunService } from './engine/main/skill/requested-skill-run.service';

@Module({
  imports: [
    PrismaModule,
    LlmModule,
    IntentModule,
    SkillModule,
    PromptModule,
    ToolEngineModule,
    forwardRef(() => AgentModule),
    forwardRef(() => ChatModule),
    HostToolModule,
  ],
  providers: [
    RunAssistantArtifactStore,
    RunAssistantMessagePersistService,
    AgentRunSseEmitter,
    AgentSessionScopeService,
    AgentRunLifecycleService,
    RequestedSkillRunService,
    AgentLangGraphRunner,
    AgentEngineService,
  ],
  exports: [
    AgentEngineService,
    AgentSessionScopeService,
  ],
})
export class AgentEngineModule {}
