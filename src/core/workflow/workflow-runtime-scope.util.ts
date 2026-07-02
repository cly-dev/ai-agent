import { collectWorkflowNodeBindingRefs } from './derive-workflow-bindings-from-nodes.util';
import type { WorkflowNodeDef } from './workflow.types';

/** 从 Workflow generate_and_push 节点解析主 HostTool；可选与 PageAction.hostToolId 对齐。 */
export function resolveWorkflowPushHostToolId(
  nodes: WorkflowNodeDef[],
  preferredHostToolId?: number | null,
): number | null {
  const refs = collectWorkflowNodeBindingRefs(nodes);
  if (refs.hostToolIds.length === 0) {
    return null;
  }
  if (
    preferredHostToolId != null &&
    preferredHostToolId > 0 &&
    refs.hostToolIds.includes(preferredHostToolId)
  ) {
    return preferredHostToolId;
  }
  return refs.hostToolIds[0] ?? null;
}

/** Workflow 节点引用的 tool / hostTool 是否均在用户当前权限内。 */
export function workflowNodeRefsRunnableForUser(input: {
  nodes: WorkflowNodeDef[];
  userAllowedToolIds: ReadonlySet<number>;
  userAllowedHostToolIds: ReadonlySet<number>;
}): boolean {
  const refs = collectWorkflowNodeBindingRefs(input.nodes);
  for (const toolId of refs.toolIds) {
    if (!input.userAllowedToolIds.has(toolId)) {
      return false;
    }
  }
  for (const hostToolId of refs.hostToolIds) {
    if (!input.userAllowedHostToolIds.has(hostToolId)) {
      return false;
    }
  }
  return true;
}

/** 从 Workflow 节点收集 HTTP toolId，用于 workflow-only Skill 的 scopedTools 推导。 */
export function collectWorkflowScopedToolIds(
  nodes: WorkflowNodeDef[],
  userAllowedToolIds: ReadonlySet<number>,
): number[] {
  const refs = collectWorkflowNodeBindingRefs(nodes);
  return refs.toolIds.filter((toolId) => userAllowedToolIds.has(toolId));
}
