import type { WorkflowIrDocument } from './workflow-ir.types';

export type WorkflowIrTopologyIssue = {
  path: string;
  code: string;
  message: string;
};

/**
 * IR 文档拓扑校验（Admin / load 前置；不依赖 lower）。
 * 边 kind 与 Intent compile 一致：always | when | default。
 */
export function validateWorkflowIrTopology(
  ir: WorkflowIrDocument,
): WorkflowIrTopologyIssue[] {
  const issues: WorkflowIrTopologyIssue[] = [];
  const nodeIds = new Set<string>();

  if (ir.nodes.length === 0) {
    issues.push({
      path: 'nodes',
      code: 'empty_nodes',
      message: 'IR must contain at least one node',
    });
    return issues;
  }

  for (const node of ir.nodes) {
    if (!node.id?.trim()) {
      issues.push({
        path: 'nodes',
        code: 'missing_id',
        message: 'IR node id is required',
      });
      continue;
    }
    if (nodeIds.has(node.id)) {
      issues.push({
        path: `nodes.${node.id}`,
        code: 'duplicate_id',
        message: `Duplicate IR node id "${node.id}"`,
      });
    }
    nodeIds.add(node.id);
  }

  if (!ir.entryNodeId?.trim()) {
    issues.push({
      path: 'entryNodeId',
      code: 'missing_entry',
      message: 'entryNodeId is required',
    });
  } else if (!nodeIds.has(ir.entryNodeId)) {
    issues.push({
      path: 'entryNodeId',
      code: 'invalid_entry',
      message: `entryNodeId "${ir.entryNodeId}" not found in nodes`,
    });
  }

  if (ir.nodes.length > 1 && ir.edges.length === 0) {
    issues.push({
      path: 'edges',
      code: 'missing_edges',
      message: 'Multi-node IR requires edges',
    });
  }

  for (const edge of ir.edges) {
    if (!edge.from || !nodeIds.has(edge.from)) {
      issues.push({
        path: `edges.${edge.id}`,
        code: 'unknown_from',
        message: `Edge from unknown node "${edge.from}"`,
      });
    }
    if (!edge.to || !nodeIds.has(edge.to)) {
      issues.push({
        path: `edges.${edge.id}`,
        code: 'unknown_to',
        message: `Edge to unknown node "${edge.to}"`,
      });
    }
    if (edge.kind === 'when' && !edge.when?.trim()) {
      issues.push({
        path: `edges.${edge.id}`,
        code: 'missing_when',
        message: 'when edge requires when key',
      });
    }
  }

  return issues;
}
