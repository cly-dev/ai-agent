import type { WorkflowNodeDef, WorkflowOverrides } from './workflow.types';

export function applyWorkflowOverrides(
  nodes: WorkflowNodeDef[],
  overrides?: WorkflowOverrides | null,
): WorkflowNodeDef[] {
  if (!overrides || Object.keys(overrides).length === 0) {
    return nodes.map((node) => ({ ...node, input: { ...node.input } }));
  }

  return nodes.map((node) => {
    const override = overrides[node.id];
    if (!override?.objective) {
      return { ...node, input: { ...node.input } };
    }
    return {
      ...node,
      objective: override.objective,
      input: { ...node.input },
    };
  });
}
