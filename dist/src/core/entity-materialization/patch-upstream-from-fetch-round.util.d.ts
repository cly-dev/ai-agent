import type { AgentGraphState, AgentRunStep } from '../agent-engine/engine/main/types/agent-engine.types';
import type { TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
export declare function patchUpstreamEntitiesAfterFetchRound(input: {
    state: AgentGraphState;
    steps: AgentRunStep[];
    planBefore: TaskPlanSnapshot | null | undefined;
    planAfter: TaskPlanSnapshot | null | undefined;
    roundObservationIndices: number[];
    allObservations: Array<{
        name: string;
        output: unknown;
    }>;
}): Pick<AgentGraphState, 'materializedEntities' | 'workflowNodeOutputs' | 'steps'> | null;
