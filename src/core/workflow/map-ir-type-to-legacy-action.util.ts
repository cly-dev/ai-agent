import type { WorkflowActionKind } from './workflow.types';
import type { WorkflowIrNodeType } from './workflow-ir.types';

/**
 * IR type → 现行 legacy action 的分发表（§4.1 原生 executor 前的适配真源）。
 * - `direct`：1:1，可先双分发到现有 getWorkflowExecutor
 * - `expand`：一 IR 多 legacy 节点（由 materializeExpandIrNode 内联展开）
 * - `none`：不落节点（边语义 / 未实现）
 */
export type IrToLegacyActionMapping =
  | { kind: 'direct'; action: WorkflowActionKind }
  | {
      kind: 'expand';
      actions: readonly WorkflowActionKind[];
      note: string;
    }
  | { kind: 'none'; note: string };

const IR_TO_LEGACY: Partial<
  Record<WorkflowIrNodeType, IrToLegacyActionMapping>
> = {
  data_query: { kind: 'direct', action: 'fetch_data' },
  structured_output: { kind: 'direct', action: 'detect_clues' },
  host_effect: { kind: 'direct', action: 'generate_and_push' },
  message_send: { kind: 'direct', action: 'summarize' },
  tool_call: { kind: 'direct', action: 'write_data' },
  data_transform: {
    kind: 'expand',
    actions: ['compose_mutation'],
    note: '仅 purpose=compose_mutation 时展开；否则物化失败',
  },
  llm: {
    kind: 'expand',
    actions: ['summarize_images', 'summarize'],
    note: 'vision → summarize_images；否则 draft summarize',
  },
  human_task: {
    kind: 'expand',
    actions: ['present_mutation', 'await_user_confirm'],
    note: '标准仅 await；explainBeforeConfirm===true 时才串 present→await',
  },
  condition: {
    kind: 'none',
    note: '编译为边 when，不落 IR 节点',
  },
  router: {
    kind: 'none',
    note: '编译为边 when/default，不落 IR 节点',
  },
};

/** 可直接双分发到现有 executor 的 IR type（无需 expand）。 */
export const IR_DIRECT_EXECUTOR_TYPES = [
  'data_query',
  'structured_output',
  'host_effect',
  'message_send',
  'tool_call',
] as const satisfies readonly WorkflowIrNodeType[];

export type IrDirectExecutorType = (typeof IR_DIRECT_EXECUTOR_TYPES)[number];

export function mapIrTypeToLegacyAction(
  type: WorkflowIrNodeType,
): IrToLegacyActionMapping {
  return (
    IR_TO_LEGACY[type] ?? {
      kind: 'none',
      note: `IR type "${type}" has no legacy mapping yet`,
    }
  );
}

export function isIrDirectExecutorType(
  type: WorkflowIrNodeType,
): type is IrDirectExecutorType {
  return (IR_DIRECT_EXECUTOR_TYPES as readonly string[]).includes(type);
}

/** direct 映射的 legacy action；非 direct 返回 null。 */
export function legacyActionForDirectIrType(
  type: WorkflowIrNodeType,
): WorkflowActionKind | null {
  const mapped = mapIrTypeToLegacyAction(type);
  return mapped.kind === 'direct' ? mapped.action : null;
}
