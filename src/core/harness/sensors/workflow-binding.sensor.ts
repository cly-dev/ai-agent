import type { WorkflowBindingRefs, WorkflowDefinition } from '../../workflow/workflow.types';
import { validateWorkflowDefinition } from '../../workflow/validate-workflow.util';
import type { HarnessSensorResult } from '../harness.types';

export type WorkflowBindingSensorPayload = {
  definition: WorkflowDefinition;
  bindings: WorkflowBindingRefs;
};

export const workflowBindingSensor = {
  name: 'workflow-binding',
  run(
    _ctx: { nodeId: string; action: string },
    payload: unknown,
  ): HarnessSensorResult {
    const data = payload as WorkflowBindingSensorPayload | null | undefined;
    if (!data?.definition) {
      return {
        name: 'workflow-binding',
        verdict: 'fail',
        code: 'MISSING_DEFINITION',
        message: 'workflow definition is required for binding sensor',
      };
    }
    const issues = validateWorkflowDefinition({
      definition: data.definition,
      bindings: data.bindings ?? { toolIds: [], hostToolIds: [] },
    });
    const bindingIssues = issues.filter((issue) =>
      issue.code.endsWith('_not_bound'),
    );
    if (bindingIssues.length === 0) {
      return { name: 'workflow-binding', verdict: 'pass' };
    }
    const first = bindingIssues[0]!;
    return {
      name: 'workflow-binding',
      verdict: 'fail',
      code: first.code,
      message: first.message,
    };
  },
};

export function validateWorkflowBindingsSensor(input: {
  definition: WorkflowDefinition;
  bindings: WorkflowBindingRefs;
}): HarnessSensorResult {
  return workflowBindingSensor.run(
    { nodeId: '__config__', action: '__save__' },
    input,
  );
}
