import type { AgentGraphState } from '../agent-engine/engine/main/types/agent-engine.types';
import type { WorkflowNodeDef } from './workflow.types';
import type { EmptyFillSensorPayload } from '../harness/sensors/empty-fill.sensor';
import type { ToolEmptySensorPayload } from '../harness/sensors/tool-empty.sensor';
import { resolveFetchDataToolIds } from './resolve-workflow-node-tool-refs.util';

export function buildHarnessSensorPayload(
  def: WorkflowNodeDef | undefined,
  state: AgentGraphState,
  extra?: Record<string, unknown>,
): unknown {
  if (!def) {
    return extra ?? {};
  }
  switch (def.action) {
    case 'fetch_data': {
      const toolIds = resolveFetchDataToolIds(def.input);
      const payload: ToolEmptySensorPayload = {
        observations: state.toolObservations,
        toolId: toolIds[0],
      };
      return { ...payload, ...extra };
    }
    case 'generate_and_push': {
      const payload: EmptyFillSensorPayload = {
        fillText:
          typeof extra?.fillText === 'string' ? extra.fillText : undefined,
        dslOutcome:
          typeof extra?.dslOutcome === 'string' ? extra.dslOutcome : undefined,
      };
      return payload;
    }
    default:
      return extra ?? {};
  }
}
