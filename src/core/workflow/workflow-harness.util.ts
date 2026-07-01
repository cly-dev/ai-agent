import type { AgentGraphState } from '../agent-engine/engine/main/types/agent-engine.types';
import type { WorkflowNodeDef } from './workflow.types';
import type { EmptyFillSensorPayload } from '../harness/sensors/empty-fill.sensor';
import type { ToolEmptySensorPayload } from '../harness/sensors/tool-empty.sensor';

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
      const input = def.input as { toolId?: number };
      const payload: ToolEmptySensorPayload = {
        observations: state.toolObservations,
        toolId: input.toolId,
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
