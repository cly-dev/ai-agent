import type { WorkflowActionKind } from './workflow.types';

export function buildWorkflowNodeOutputRef(
  action: WorkflowActionKind,
  nodeId: string,
): string {
  return `obs:${action}:${nodeId}`;
}
