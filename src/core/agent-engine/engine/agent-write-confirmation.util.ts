import type { PendingToolObservation } from '../../../modules/chat/pending-write-confirmation.types';
import type { ToolObservation } from './main/agent-engine.types';

export function serializeObservationsForPending(
  observations: ToolObservation[],
): PendingToolObservation[] {
  return observations.map((observation) => ({
    name: observation.name,
    output: observation.output,
    llmPayload: observation.llmPayload,
    quality: observation.quality,
    fieldLabels: observation.fieldLabels,
    fieldDescriptions: observation.fieldDescriptions,
    enumLabelsByPath: observation.enumLabelsByPath,
  }));
}

export function deserializePendingObservations(
  rows: PendingToolObservation[],
): ToolObservation[] {
  return rows.map((row) => ({
    name: row.name,
    output: row.output,
    llmPayload: row.llmPayload as ToolObservation['llmPayload'],
    quality: row.quality,
    fieldLabels: row.fieldLabels,
    fieldDescriptions: row.fieldDescriptions,
    enumLabelsByPath: row.enumLabelsByPath,
  }));
}
