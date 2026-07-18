import type { WorkflowIrDocument, WorkflowIrNode } from './workflow-ir.types';
import type { WorkflowNodeDef } from './workflow.types';

/** 物化步是否为 expand 内联子步（def.id ≠ 来源 IR 节点 id）。 */
export function isMaterializedExpandSubStep(def: WorkflowNodeDef): boolean {
  return (
    def.irNodeId != null &&
    def.irNodeId.length > 0 &&
    def.id !== def.irNodeId
  );
}

export function indexWorkflowIrNodesById(
  ir: WorkflowIrDocument,
): Map<string, WorkflowIrNode> {
  return new Map(ir.nodes.map((node) => [node.id, node]));
}

/** 由物化节点反查来源 IR 节点；direct 步 id 与 irNodeId 相同。 */
export function resolveSourceIrNode(
  def: WorkflowNodeDef,
  ir: WorkflowIrDocument,
): WorkflowIrNode | undefined {
  const irNodeId = def.irNodeId ?? def.id;
  return indexWorkflowIrNodesById(ir).get(irNodeId);
}
