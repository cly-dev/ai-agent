import type { WorkflowActionKind } from '../../workflow/workflow.types';
import { emptyFillSensor } from './empty-fill.sensor';
import { emptySummarySensor } from './empty-summary.sensor';
import { toolEmptySensor } from './tool-empty.sensor';
import type { HarnessSensor } from '../harness.types';

const SENSORS_BY_ACTION: Partial<Record<WorkflowActionKind, HarnessSensor[]>> = {
  fetch_data: [toolEmptySensor],
  generate_and_push: [emptyFillSensor],
  summarize: [emptySummarySensor],
};

export function harnessSensorsForWorkflowAction(
  action: WorkflowActionKind,
): HarnessSensor[] {
  return SENSORS_BY_ACTION[action] ?? [];
}
