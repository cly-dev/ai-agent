import type { AgentRunStep } from '../agent-engine/engine/main/types/agent-engine.types';
import type { PageActionRunStepRecorder } from '../page-action/page-action-run-steps.util';
import type { MaterializedEntity } from './entity-materialization.types';
import { serializeEntitiesForAudit } from './entity-materialization-audit.util';

export function recordPageActionEntityMaterialization(
  recorder: PageActionRunStepRecorder,
  entities: readonly MaterializedEntity[],
  options?: { name?: string },
): void {
  recorder.record({
    type: 'entity',
    name: options?.name ?? 'entity_materialization',
    status: 'ok',
    detail: serializeEntitiesForAudit(entities),
  });
}

export function buildAgentEntityMaterializationStep(input: {
  step: number;
  entities: readonly MaterializedEntity[];
  name?: string;
}): AgentRunStep {
  return {
    step: input.step,
    type: 'entity',
    name: input.name ?? 'entity_materialization',
    output: serializeEntitiesForAudit(input.entities),
  };
}
