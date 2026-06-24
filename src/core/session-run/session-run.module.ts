import { Module, forwardRef } from '@nestjs/common';
import { AgentEngineModule } from '../agent-engine/agent-engine.module';
import { ChatSessionRunBridgeModule } from '../../modules/chat/chat-session-run-bridge.module';
import { AgentRunLauncher } from './agent-run-launcher.service';
import { AgentRunSseGateway } from './agent-run-sse.gateway';
import { SessionRunCoordinator } from './session-run-coordinator.service';

@Module({
  imports: [
    ChatSessionRunBridgeModule,
    forwardRef(() => AgentEngineModule),
  ],
  providers: [SessionRunCoordinator, AgentRunLauncher, AgentRunSseGateway],
  exports: [SessionRunCoordinator, AgentRunLauncher, AgentRunSseGateway],
})
export class SessionRunModule {}
