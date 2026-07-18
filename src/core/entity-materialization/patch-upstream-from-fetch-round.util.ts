import type { AgentGraphState, AgentRunStep } from '../agent-engine/engine/main/types/agent-engine.types';
import type { TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
import { parseResponseProfile } from '../tool-engine/tool-output-projection.util';
import { buildWorkflowNodeOutputRef } from '../workflow/workflow-node-output.util';
import { buildAgentEntityMaterializationStep } from './record-entity-materialization.util';
import {
  materializeEntitiesFromToolOutput,
  mergeMaterializedEntities,
} from './entity-materializer.util';
import type { MaterializedEntity } from './entity-materialization.types';

function newlyCompletedStepIds(
  planBefore: TaskPlanSnapshot | null | undefined,
  planAfter: TaskPlanSnapshot | null | undefined,
): string[] {
  if (!planAfter) {
    return [];
  }
  const before = new Set(planBefore?.completedStepIds ?? []);
  return planAfter.completedStepIds.filter((id) => !before.has(id));
}

/**
 * Chat workflow_react 完成 fetch_data 步后：从本轮 tool 观测物化 upstream 实体，
 * 并镜像进 workflowNodeOutputs，供后续 summarize_images from=upstream 消费。
 */
export function patchUpstreamEntitiesAfterFetchRound(input: {
  state: AgentGraphState;
  steps: AgentRunStep[];
  planBefore: TaskPlanSnapshot | null | undefined;
  planAfter: TaskPlanSnapshot | null | undefined;
  roundObservationIndices: number[];
  allObservations: Array<{ name: string; output: unknown }>;
}): Pick<AgentGraphState, 'materializedEntities' | 'workflowNodeOutputs' | 'steps'> | null {
  const completedIds = newlyCompletedStepIds(input.planBefore, input.planAfter);
  if (completedIds.length === 0 || input.roundObservationIndices.length === 0) {
    return null;
  }

  const fetchNodeIds = completedIds.filter((stepId) => {
    const def = input.state.workflowNodeDefs?.find((row) => row.id === stepId);
    return def?.action === 'fetch_data';
  });
  if (fetchNodeIds.length === 0) {
    return null;
  }

  let entities: MaterializedEntity[] = [
    ...(input.state.materializedEntities ?? []),
  ];
  const workflowNodeOutputs = { ...(input.state.workflowNodeOutputs ?? {}) };
  let changed = false;

  for (const nodeId of fetchNodeIds) {
    for (const index of input.roundObservationIndices) {
      const observation = input.allObservations[index];
      if (!observation) {
        continue;
      }
      const tool = input.state.scopedTools.find(
        (row) => row.name === observation.name,
      );
      const profile = parseResponseProfile(tool?.responseProfile);
      const incoming = materializeEntitiesFromToolOutput({
        raw: observation.output,
        profile,
      });
      if (incoming.length === 0) {
        continue;
      }
      entities = mergeMaterializedEntities(entities, incoming);
      workflowNodeOutputs[buildWorkflowNodeOutputRef('fetch_data', nodeId)] = {
        toolName: observation.name,
        toolId: tool?.id ?? null,
        output: observation.output,
      };
      changed = true;
    }
  }

  if (!changed) {
    return null;
  }

  const nextStep =
    input.steps.length > 0
      ? Math.max(...input.steps.map((row) => row.step)) + 1
      : 1;
  const steps = [
    ...input.steps,
    buildAgentEntityMaterializationStep({
      step: nextStep,
      entities,
      name: 'entity_materialization_upstream',
    }),
  ];

  return {
    materializedEntities: entities,
    workflowNodeOutputs,
    steps,
  };
}
