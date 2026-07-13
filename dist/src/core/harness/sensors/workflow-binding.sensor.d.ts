import type { WorkflowBindingRefs, WorkflowDefinition } from '../../workflow/workflow.types';
import type { HarnessSensorResult } from '../harness.types';
export type WorkflowBindingSensorPayload = {
    definition: WorkflowDefinition;
    bindings: WorkflowBindingRefs;
};
export declare const workflowBindingSensor: {
    name: string;
    run(_ctx: {
        nodeId: string;
        action: string;
    }, payload: unknown): HarnessSensorResult;
};
export declare function validateWorkflowBindingsSensor(input: {
    definition: WorkflowDefinition;
    bindings: WorkflowBindingRefs;
}): HarnessSensorResult;
