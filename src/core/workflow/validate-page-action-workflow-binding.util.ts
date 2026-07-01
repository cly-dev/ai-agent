import { collectWorkflowNodeBindingRefs } from './derive-workflow-bindings-from-nodes.util';
import type { WorkflowNodeDef, WorkflowValidationIssue } from './workflow.types';

function pushIssue(
  issues: WorkflowValidationIssue[],
  path: string,
  code: string,
  message: string,
): void {
  issues.push({ path, code, message });
}

/** PageAction 绑定 Workflow 时：主 hostToolId 须出现在 Workflow generate_and_push 节点上。 */
export function validatePageActionWorkflowBinding(input: {
  pageActionHostToolId: number;
  nodes: WorkflowNodeDef[];
}): WorkflowValidationIssue[] {
  const issues: WorkflowValidationIssue[] = [];
  const refs = collectWorkflowNodeBindingRefs(input.nodes);
  if (refs.hostToolIds.length === 0) {
    pushIssue(
      issues,
      'nodes',
      'missing_generate_and_push',
      'Workflow bound to PageAction must include at least one generate_and_push node with input.hostToolId',
    );
    return issues;
  }
  if (!refs.hostToolIds.includes(input.pageActionHostToolId)) {
    pushIssue(
      issues,
      'hostToolId',
      'page_action_host_tool_not_in_workflow_nodes',
      `PageAction.hostToolId=${input.pageActionHostToolId} must match a generate_and_push node input.hostToolId in Workflow (found: ${refs.hostToolIds.join(', ')})`,
    );
  }
  return issues;
}
