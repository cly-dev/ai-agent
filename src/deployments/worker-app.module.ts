import { Module } from '@nestjs/common';
import { AgentEngineModule } from '../core/agent-engine/agent-engine.module';
import { ChatEventsModule } from '../modules/chat/chat-events.module';
import { SessionRunModule } from '../core/session-run/session-run.module';
import { AgentModule } from '../modules/agent/agent.module';
import { HostToolModule } from '../modules/host-tool/host-tool.module';
import { SkillModule } from '../core/skill/skill.module';
import { ToolEngineModule } from '../core/tool-engine/tool-engine.module';
import { IntentModule } from '../core/intent/intent.module';
import { SharedInfraModule } from './shared-infra.module';

/**
 * Worker 部署单元（omnix-worker:3031）。
 */
@Module({
  imports: [
    SharedInfraModule,
    IntentModule,
    SkillModule,
    ToolEngineModule,
    AgentModule,
    HostToolModule,
    ChatEventsModule,
    AgentEngineModule,
    SessionRunModule,
  ],
})
export class WorkerAppModule {}
