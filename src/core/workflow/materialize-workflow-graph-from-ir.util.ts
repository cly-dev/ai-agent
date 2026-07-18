import { deriveWorkflowNodeInputFromIr } from './derive-workflow-node-input-from-ir.util';
import {
  isIrDirectExecutorType,
  mapIrTypeToLegacyAction,
} from './map-ir-type-to-legacy-action.util';
import type { WorkflowIrDocument, WorkflowIrNode } from './workflow-ir.types';
import type {
  WorkflowActionKind,
  WorkflowEdge,
  WorkflowNodeDef,
} from './workflow.types';
import type { WorkflowNodeInputByAction } from './workflow-node-input.types';

export type MaterializedWorkflowGraph = {
  nodes: WorkflowNodeDef[];
  edges: WorkflowEdge[];
  entryNodeId: string;
  /** true = IR 仅含 direct type（无 llm/human_task/data_transform expand） */
  materializedDirectFromIr: boolean;
  ir: WorkflowIrDocument;
};

function objectiveFromIrNode(node: WorkflowIrNode): string {
  const cfg = node.config ?? {};
  return typeof cfg.objective === 'string'
    ? cfg.objective
    : (node.name ?? node.type);
}

function stampIrProvenance(
  node: WorkflowIrNode,
  def: WorkflowNodeDef,
): WorkflowNodeDef {
  return {
    ...def,
    irType: node.type,
    irNodeId: node.id,
    irConfig: node.config ?? {},
  };
}

function inputFromIr(
  node: WorkflowIrNode,
  action: WorkflowActionKind,
): WorkflowNodeInputByAction[WorkflowActionKind] {
  const derived = deriveWorkflowNodeInputFromIr({
    irType: node.type,
    config: node.config ?? {},
    action,
  });
  if (derived == null) {
    throw new Error(
      `materialize: cannot derive input for IR ${node.type} → ${action}`,
    );
  }
  return derived;
}

/** direct IR → 单个 WorkflowNodeDef。 */
export function materializeDirectIrNode(node: WorkflowIrNode): WorkflowNodeDef {
  const objective = objectiveFromIrNode(node);
  const mapping = mapIrTypeToLegacyAction(node.type);
  if (mapping.kind !== 'direct') {
    throw new Error(
      `materializeDirectIrNode: IR type "${node.type}" is not direct`,
    );
  }

  switch (node.type) {
    case 'data_query':
      return stampIrProvenance(node, {
        id: node.id,
        action: 'fetch_data',
        name: node.name ?? '获取数据',
        objective,
        input: inputFromIr(node, 'fetch_data') as WorkflowNodeInputByAction['fetch_data'],
      });
    case 'host_effect':
      return stampIrProvenance(node, {
        id: node.id,
        action: 'generate_and_push',
        name: node.name ?? '推送到页面',
        objective,
        input: inputFromIr(
          node,
          'generate_and_push',
        ) as WorkflowNodeInputByAction['generate_and_push'],
      });
    case 'message_send':
      return stampIrProvenance(node, {
        id: node.id,
        action: 'summarize',
        name: node.name ?? '说明总结',
        objective,
        input: inputFromIr(node, 'summarize') as WorkflowNodeInputByAction['summarize'],
      });
    case 'structured_output':
      return stampIrProvenance(node, {
        id: node.id,
        action: 'detect_clues',
        name: node.name ?? '状态识别',
        objective,
        input: inputFromIr(
          node,
          'detect_clues',
        ) as WorkflowNodeInputByAction['detect_clues'],
      });
    case 'tool_call':
      return stampIrProvenance(node, {
        id: node.id,
        action: 'write_data',
        name: node.name ?? '提交变更',
        objective,
        input: inputFromIr(node, 'write_data') as WorkflowNodeInputByAction['write_data'],
      });
  }
  throw new Error(`materializeDirectIrNode: unhandled direct type ${node.type}`);
}

/**
 * expand IR → 一个或多个可执行步（§4.1d：内聚在物化层，不再依赖 lower 桥）。
 * human_task 仍展开 present→await，但 irType 保留来源 IR type 供双分发记账。
 */
export function materializeExpandIrNode(node: WorkflowIrNode): WorkflowNodeDef[] {
  const cfg = node.config ?? {};
  const objective = objectiveFromIrNode(node);

  switch (node.type) {
    case 'llm':
      if ((cfg.capabilities as { vision?: boolean } | undefined)?.vision) {
        return [
          stampIrProvenance(node, {
            id: node.id,
            action: 'summarize_images',
            name: node.name ?? '图片识别',
            objective,
            input: inputFromIr(
              node,
              'summarize_images',
            ) as WorkflowNodeInputByAction['summarize_images'],
          }),
        ];
      }
      return [
        stampIrProvenance(node, {
          id: `${node.id}__draft`,
          action: 'summarize',
          name: node.name ?? '生成',
          objective,
          input: inputFromIr(node, 'summarize') as WorkflowNodeInputByAction['summarize'],
        }),
      ];
    case 'data_transform':
      if (cfg.purpose === 'compose_mutation') {
        return [
          stampIrProvenance(node, {
            id: node.id,
            action: 'compose_mutation',
            name: node.name ?? '组装变更参数',
            objective,
            input: inputFromIr(
              node,
              'compose_mutation',
            ) as WorkflowNodeInputByAction['compose_mutation'],
          }),
        ];
      }
      return [];
    case 'human_task': {
      // 标准审批门仅 await；explainBeforeConfirm===true 才前置 present 说明
      const explain = cfg.explainBeforeConfirm === true;
      const awaitDef = stampIrProvenance(node, {
        id: node.id,
        action: 'await_user_confirm',
        name: node.name ?? '等待用户确认',
        objective,
        input: inputFromIr(
          node,
          'await_user_confirm',
        ) as WorkflowNodeInputByAction['await_user_confirm'],
      });
      if (!explain) {
        return [awaitDef];
      }
      return [
        stampIrProvenance(node, {
          id: `${node.id}__present`,
          action: 'present_mutation',
          name: '展示变更草稿',
          objective: 'Present the pending mutation draft.',
          input: inputFromIr(
            node,
            'present_mutation',
          ) as WorkflowNodeInputByAction['present_mutation'],
        }),
        awaitDef,
      ];
    }
    default:
      return [];
  }
}

/** 单 IR 节点 → 可执行 WorkflowNodeDef 列表（direct 或 expand）。 */
export function materializeIrNodeToDefs(node: WorkflowIrNode): WorkflowNodeDef[] {
  if (isIrDirectExecutorType(node.type)) {
    return [materializeDirectIrNode(node)];
  }
  return materializeExpandIrNode(node);
}

export function workflowIrHasExpandTypes(ir: WorkflowIrDocument): boolean {
  return ir.nodes.some((node) => !isIrDirectExecutorType(node.type));
}

/**
 * 从 IR 文档物化完整执行图（§4.1f：统一入口，不再调用 lower）。
 * expand 节点按 IR 内联展开并串 always 子边，与旧 lower 拓扑等价。
 */
export function materializeWorkflowGraphFromIr(
  ir: WorkflowIrDocument,
): MaterializedWorkflowGraph {
  const nodes: WorkflowNodeDef[] = [];
  const edges: WorkflowEdge[] = [];
  const entryOf = new Map<string, string>();
  const exitOf = new Map<string, string>();

  for (const node of ir.nodes) {
    const materialized = materializeIrNodeToDefs(node);
    if (materialized.length === 0) {
      throw new Error(
        `materializeWorkflowGraphFromIr: IR node "${node.id}" (type=${node.type}) produced no executable nodes`,
      );
    }
    entryOf.set(node.id, materialized[0]!.id);
    exitOf.set(node.id, materialized[materialized.length - 1]!.id);
    nodes.push(...materialized);
    for (let i = 0; i < materialized.length - 1; i++) {
      edges.push({
        id: `ir:${materialized[i]!.id}->${materialized[i + 1]!.id}`,
        from: materialized[i]!.id,
        to: materialized[i + 1]!.id,
        kind: 'always',
      });
    }
  }

  for (const e of ir.edges) {
    const from = exitOf.get(e.from);
    const to = entryOf.get(e.to);
    if (!from || !to) {
      throw new Error(
        `materializeWorkflowGraphFromIr: cannot map edge ${e.id} (${e.from}→${e.to})`,
      );
    }
    if (e.kind === 'when') {
      edges.push({
        id: e.id,
        from,
        to,
        kind: 'clue',
        clue: e.when
          ? {
              key: e.when,
              // 优先 Intent 下发的说明；缺省回退 key（兼容旧 IR）
              description: e.whenDescription?.trim() || e.when,
            }
          : undefined,
      });
    } else if (e.kind === 'default') {
      edges.push({ id: e.id, from, to, kind: 'default' });
    } else {
      edges.push({ id: e.id, from, to, kind: 'always' });
    }
  }

  const entryNodeId = entryOf.get(ir.entryNodeId);
  if (!entryNodeId) {
    throw new Error(
      `materializeWorkflowGraphFromIr: entryNodeId "${ir.entryNodeId}" has no materialized entry`,
    );
  }

  const directOnly = !workflowIrHasExpandTypes(ir);
  return {
    nodes,
    edges,
    entryNodeId,
    materializedDirectFromIr: directOnly,
    ir,
  };
}

/** @deprecated 仅测试 / 归档对照；热路径请用 materializeWorkflowGraphFromIr。 */
export function workflowIrNeedsLegacyLower(_ir: WorkflowIrDocument): boolean {
  return false;
}
