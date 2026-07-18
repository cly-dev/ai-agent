import {
  isIrDirectExecutorType,
  legacyActionForDirectIrType,
  mapIrTypeToLegacyAction,
} from '../map-ir-type-to-legacy-action.util';
import type { WorkflowIrNodeType } from '../workflow-ir.types';
import type { WorkflowActionKind, WorkflowNodeDef } from '../workflow.types';
import {
  getWorkflowExecutor,
  getWorkflowExecutorByIrType,
} from './executor-registry';
import type { WorkflowExecutor } from './workflow-executor.types';

/**
 * Runtime 节点调度解析（§4.1 双分发）。
 * - `ir_direct`：IR type 1:1 映射到现有 executor（主路径终态入口）
 * - `ir_expand_adapter`：expand 物化子步，仍走 legacy action executor，irType/irNodeId 记账
 * - `legacy_action`：无 irType（旧图 / 未打标）
 */
export type WorkflowNodeExecutorDispatchKind =
  | 'ir_direct'
  | 'ir_expand_adapter'
  | 'legacy_action';

export type ResolvedWorkflowNodeExecutor = {
  executor: WorkflowExecutor | null;
  action: WorkflowActionKind;
  dispatchKind: WorkflowNodeExecutorDispatchKind;
  irType?: WorkflowIrNodeType;
  irNodeId?: string;
};

export function resolveWorkflowNodeExecutor(
  def: WorkflowNodeDef,
  profile: 'chat' | 'page' = 'chat',
): ResolvedWorkflowNodeExecutor {
  const irType = def.irType;
  const irNodeId = def.irNodeId;

  if (irType && isIrDirectExecutorType(irType)) {
    const mapped = legacyActionForDirectIrType(irType);
    const action = mapped ?? def.action;
    return {
      executor: getWorkflowExecutorByIrType(irType, profile),
      action,
      dispatchKind: 'ir_direct',
      irType,
      irNodeId,
    };
  }

  if (irType) {
    const mapping = mapIrTypeToLegacyAction(irType);
    if (mapping.kind === 'expand') {
      return {
        executor: getWorkflowExecutor(def.action, profile),
        action: def.action,
        dispatchKind: 'ir_expand_adapter',
        irType,
        irNodeId,
      };
    }
  }

  return {
    executor: getWorkflowExecutor(def.action, profile),
    action: def.action,
    dispatchKind: 'legacy_action',
    irType,
    irNodeId,
  };
}

/** 图上节点是否均可按 IR 双分发（含 expand adapter）；用于观测 / 门禁。 */
export function workflowNodesAreIrDispatched(nodes: WorkflowNodeDef[]): boolean {
  return nodes.length > 0 && nodes.every((n) => n.irType != null);
}
