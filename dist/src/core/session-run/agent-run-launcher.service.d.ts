import { AgentEngineService } from '../agent-engine/engine/agent-engine.service';
import type { AgentRunSseGateway } from './agent-run-sse.gateway';
import { RunExecutionScope } from './run-execution.scope';
import type { RunJob } from './session-run.types';
export declare class AgentRunLauncher {
    private readonly agentEngine;
    private readonly runSse;
    private readonly logger;
    constructor(agentEngine: AgentEngineService, runSse: AgentRunSseGateway);
    execute(job: RunJob, scope: RunExecutionScope): Promise<void>;
}
