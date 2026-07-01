import type { ToolObservation } from '../../agent-engine/engine/main/types/agent-engine.types';
import {
  classifyToolExecutionStatus,
  type ToolExecutionStatusContext,
} from '../../agent-engine/engine/tool/tool-execution-status.util';
import type { HarnessSensorResult } from '../harness.types';

export type ToolEmptySensorPayload = {
  observations?: ToolObservation[];
  toolId?: number;
  toolName?: string;
  agentMetadata?: unknown;
};

function observationMatchesTool(
  observation: ToolObservation,
  payload: ToolEmptySensorPayload,
): boolean {
  if (payload.toolName && observation.name === payload.toolName) {
    return true;
  }
  return payload.toolName == null;
}

export const toolEmptySensor = {
  name: 'tool-empty',
  run(
    _ctx: { nodeId: string; action: string },
    payload: unknown,
  ): HarnessSensorResult {
    const data = (payload ?? {}) as ToolEmptySensorPayload;
    const observations = data.observations ?? [];
    const context: ToolExecutionStatusContext = {
      agentMetadata: data.agentMetadata,
    };
    const relevant = observations.filter((row) =>
      observationMatchesTool(row, data),
    );
    if (relevant.length === 0) {
      return {
        name: 'tool-empty',
        verdict: 'fail',
        code: 'TOOL_EMPTY',
        message: 'no tool observation produced for fetch_data step',
      };
    }
    const hasSuccess = relevant.some(
      (row) =>
        classifyToolExecutionStatus(row.output, context) === 'SUCCESS',
    );
    if (hasSuccess) {
      return { name: 'tool-empty', verdict: 'pass' };
    }
    const allEmpty = relevant.every(
      (row) =>
        classifyToolExecutionStatus(row.output, context) === 'EMPTY',
    );
    if (allEmpty) {
      return {
        name: 'tool-empty',
        verdict: 'fail',
        code: 'TOOL_EMPTY',
        message: 'tool observations are EMPTY',
      };
    }
    return { name: 'tool-empty', verdict: 'pass' };
  },
};
