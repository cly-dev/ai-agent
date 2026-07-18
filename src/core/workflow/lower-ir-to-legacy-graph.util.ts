import type { WorkflowEdge, WorkflowNodeDef } from './workflow.types';
import type { WorkflowIrDocument } from './workflow-ir.types';
import { materializeWorkflowGraphFromIr } from './materialize-workflow-graph-from-ir.util';

/**
 * @deprecated 过渡桥别名；实现已迁至 materializeWorkflowGraphFromIr（§4.1f）。
 * 禁止把产物当作配置真源写回 Intent/Flow。
 */
export function lowerWorkflowIrToLegacyGraph(ir: WorkflowIrDocument): {
  nodes: WorkflowNodeDef[];
  edges: WorkflowEdge[];
  entryNodeId: string;
} {
  const materialized = materializeWorkflowGraphFromIr(ir);
  return {
    nodes: materialized.nodes,
    edges: materialized.edges,
    entryNodeId: materialized.entryNodeId,
  };
}
