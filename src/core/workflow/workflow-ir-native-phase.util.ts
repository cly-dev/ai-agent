import { deriveWorkflowNodeInputFromIr } from './derive-workflow-node-input-from-ir.util';
import type { WorkflowIrNode } from './workflow-ir.types';
import type { WorkflowActionKind, WorkflowNodeDef } from './workflow.types';
import type { WorkflowNodeInputByAction } from './workflow-node-input.types';

/**
 * Plan A §4.3f：单 IR 节点内多执行相位（替代 __present / __draft 合成 id）。
 * run.nodeId 始终等于 irNode.id；相位推进不跟 IR 边。
 */
export type WorkflowIrNativePhase =
  | 'execute'
  | 'draft'
  | 'present'
  | 'await';

function objectiveFromIrNode(node: WorkflowIrNode): string {
  const cfg = node.config ?? {};
  return typeof cfg.objective === 'string'
    ? cfg.objective
    : (node.name ?? node.type);
}

function stamp(
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

function inputFor(
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
      `native phase: cannot derive input for ${node.type} → ${action}`,
    );
  }
  return derived;
}

/** 该 IR 节点的相位序列（首相位为入口）。 */
export function resolveWorkflowIrNativePhases(
  node: WorkflowIrNode,
): WorkflowIrNativePhase[] {
  const cfg = node.config ?? {};
  switch (node.type) {
    case 'human_task':
      if (cfg.explainBeforeConfirm === true) {
        return ['present', 'await'];
      }
      return ['await'];
    case 'llm':
      if ((cfg.capabilities as { vision?: boolean } | undefined)?.vision) {
        return ['execute'];
      }
      return ['draft'];
    default:
      return ['execute'];
  }
}

export function actionForWorkflowIrNativePhase(
  node: WorkflowIrNode,
  phase: WorkflowIrNativePhase,
): WorkflowActionKind {
  switch (phase) {
    case 'present':
      return 'present_mutation';
    case 'await':
      return 'await_user_confirm';
    case 'draft':
      return 'summarize';
    case 'execute':
      break;
  }
  switch (node.type) {
    case 'data_query':
      return 'fetch_data';
    case 'structured_output':
      return 'detect_clues';
    case 'host_effect':
      return 'generate_and_push';
    case 'message_send':
      return 'summarize';
    case 'tool_call':
      return 'write_data';
    case 'data_transform':
      return 'compose_mutation';
    case 'llm':
      return (node.config?.capabilities as { vision?: boolean } | undefined)
        ?.vision
        ? 'summarize_images'
        : 'summarize';
    case 'human_task':
      return 'await_user_confirm';
    default:
      throw new Error(
        `actionForWorkflowIrNativePhase: unsupported IR type ${node.type}`,
      );
  }
}

/** 按相位合成可执行 def；**id 恒为 irNode.id**（无 __present / __draft）。 */
export function materializeWorkflowIrNodeForPhase(
  node: WorkflowIrNode,
  phase: WorkflowIrNativePhase,
): WorkflowNodeDef {
  const action = actionForWorkflowIrNativePhase(node, phase);
  const objective = objectiveFromIrNode(node);
  const name =
    phase === 'present'
      ? '展示变更草稿'
      : phase === 'await'
        ? (node.name ?? '等待用户确认')
        : phase === 'draft'
          ? (node.name ?? '生成')
          : (node.name ?? node.type);

  return stamp(node, {
    id: node.id,
    action,
    name,
    objective:
      phase === 'present' ? 'Present the pending mutation draft.' : objective,
    input: inputFor(node, action) as WorkflowNodeInputByAction[typeof action],
  });
}

export function nextWorkflowIrNativePhase(
  node: WorkflowIrNode,
  current: WorkflowIrNativePhase,
): WorkflowIrNativePhase | null {
  const phases = resolveWorkflowIrNativePhases(node);
  const index = phases.indexOf(current);
  if (index < 0 || index >= phases.length - 1) {
    return null;
  }
  return phases[index + 1]!;
}
