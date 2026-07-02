import type { WorkflowNodeDef, WorkflowValidationIssue } from './workflow.types';

/** @deprecated PageAction 不再在保存期校验 Workflow 节点结构（含 generate_and_push）。 */
export function validatePageActionWorkflowBinding(_input: {
  pageActionHostToolId?: number | null;
  nodes: WorkflowNodeDef[];
}): WorkflowValidationIssue[] {
  return [];
}
