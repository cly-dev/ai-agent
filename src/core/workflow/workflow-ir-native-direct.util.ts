import { materializeIrNodeToDefs } from './materialize-workflow-graph-from-ir.util';
import {
  materializeWorkflowIrNodeForPhase,
  resolveWorkflowIrNativePhases,
  type WorkflowIrNativePhase,
} from './workflow-ir-native-phase.util';
import type { WorkflowIrDocument, WorkflowIrNode } from './workflow-ir.types';
import type { WorkflowEdge, WorkflowNodeDef } from './workflow.types';

export type WorkflowExecutionMode =
  | 'ir_native_direct'
  | 'materialized_expand';

/**
 * 单 IR 节点是否可在 native 车道执行（含多相位 present→await / draft）。
 * 不能物化的 type 仍走整图 materialize 回退。
 */
export function isWorkflowIrNodeNativeFlat(node: WorkflowIrNode): boolean {
  try {
    const defs = materializeIrNodeToDefs(node);
    return defs.length >= 1;
  } catch {
    return false;
  }
}

/**
 * Plan A：整图是否可走 native（IR 为图真源）。
 * 含标准 mutate、explainBeforeConfirm（相位）、非 vision llm（draft 相位）。
 */
export function isWorkflowIrNativeDirectEligible(
  ir: WorkflowIrDocument,
): boolean {
  if (ir.nodes.length === 0) {
    return false;
  }
  return ir.nodes.every((node) => isWorkflowIrNodeNativeFlat(node));
}

/** IR when/default/always → 现行 advance 可消费的 WorkflowEdge。 */
export function irEdgesToWorkflowEdges(
  ir: WorkflowIrDocument,
): WorkflowEdge[] {
  return ir.edges.map((e) => {
    if (e.kind === 'when') {
      return {
        id: e.id,
        from: e.from,
        to: e.to,
        kind: 'clue' as const,
        clue: e.when
          ? {
              key: e.when,
              description: e.whenDescription?.trim() || e.when,
            }
          : undefined,
      };
    }
    if (e.kind === 'default') {
      return { id: e.id, from: e.from, to: e.to, kind: 'default' as const };
    }
    return { id: e.id, from: e.from, to: e.to, kind: 'always' as const };
  });
}

export type NativeDirectGraphFromIr = {
  nodes: WorkflowNodeDef[];
  edges: WorkflowEdge[];
  entryNodeId: string;
  ir: WorkflowIrDocument;
  executionMode: 'ir_native_direct';
  materializedDirectFromIr: true;
  /** nodeId → 入口相位 */
  phasesByNodeId: Record<string, WorkflowIrNativePhase>;
};

/** 入口相位的可执行 def；id === irNode.id。 */
export function materializeNativeFlatIrNode(
  node: WorkflowIrNode,
): WorkflowNodeDef {
  const phases = resolveWorkflowIrNativePhases(node);
  return materializeWorkflowIrNodeForPhase(node, phases[0]!);
}

/**
 * 从 IR 构建可执行图：每 IR 节点恰好一个 def（id=irNodeId），
 * 多步语义靠 run.phase，不再生成 __present / __draft。
 */
export function buildNativeDirectGraphFromIr(
  ir: WorkflowIrDocument,
): NativeDirectGraphFromIr {
  if (!isWorkflowIrNativeDirectEligible(ir)) {
    throw new Error(
      'buildNativeDirectGraphFromIr: IR is not native eligible',
    );
  }
  const phasesByNodeId: Record<string, WorkflowIrNativePhase> = {};
  const nodes = ir.nodes.map((node) => {
    const phase = resolveWorkflowIrNativePhases(node)[0]!;
    phasesByNodeId[node.id] = phase;
    return materializeWorkflowIrNodeForPhase(node, phase);
  });
  return {
    nodes,
    edges: irEdgesToWorkflowEdges(ir),
    entryNodeId: ir.entryNodeId,
    ir,
    executionMode: 'ir_native_direct',
    materializedDirectFromIr: true,
    phasesByNodeId,
  };
}
