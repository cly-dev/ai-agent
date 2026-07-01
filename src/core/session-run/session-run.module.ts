import { Module, forwardRef } from '@nestjs/common';
import { AgentEngineModule } from '../agent-engine/agent-engine.module';
import { MemoryModule } from '../memory/memory.module';
import { ChatSessionRunBridgeModule } from '../../modules/chat/chat-session-run-bridge.module';
import { AgentRunLauncher } from './agent-run-launcher.service';
import { AgentRunSseGateway } from './agent-run-sse.gateway';
import { SessionRunCoordinator } from './session-run-coordinator.service';
import { SessionRunJobQueueService } from './session-run-job-queue.service';

@Module({
  imports: [
    MemoryModule,
    ChatSessionRunBridgeModule,
    forwardRef(() => AgentEngineModule),
  ],
  providers: [
    SessionRunCoordinator,
    SessionRunJobQueueService,
    AgentRunLauncher,
    AgentRunSseGateway,
  ],
  exports: [SessionRunCoordinator, AgentRunLauncher, AgentRunSseGateway],
})
export class SessionRunModule {}
