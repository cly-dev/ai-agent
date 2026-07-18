import type { AgentRunStep } from '../agent-engine/engine/main/types/agent-engine.types';
import type { PageActionRunStepRecorder } from '../page-action/page-action-run-steps.util';
import type { MaterializedEntity } from './entity-materialization.types';
export declare function recordPageActionEntityMaterialization(recorder: PageActionRunStepRecorder, entities: readonly MaterializedEntity[], options?: {
    name?: string;
}): void;
export declare function buildAgentEntityMaterializationStep(input: {
    step: number;
    entities: readonly MaterializedEntity[];
    name?: string;
}): AgentRunStep;
