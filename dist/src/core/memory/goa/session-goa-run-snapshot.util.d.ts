import type { AgentGraphState } from '../../agent-engine/engine/main/types/agent-engine.types';
import type { AgentRunGoaSnapshot } from './session-goa.types';
export declare function buildAgentRunGoaSnapshot(input: {
    graphState: Pick<AgentGraphState, 'taskPlan' | 'intentKind' | 'awaitingWriteConfirmation' | 'status' | 'workflowRun'>;
    runFailed?: boolean;
}): AgentRunGoaSnapshot | null;
export declare function parseAgentRunGoaSnapshot(value: unknown): AgentRunGoaSnapshot | null;
export declare function isResumableGoaSnapshot(snapshot: AgentRunGoaSnapshot): boolean;
