import type { WorkflowActionKind } from '../../workflow/workflow.types';
import type { HarnessSensor } from '../harness.types';
export declare function harnessSensorsForWorkflowAction(action: WorkflowActionKind): HarnessSensor[];
