import { deriveWorkflowNodeInputFromIr } from './derive-workflow-node-input-from-ir.util';
import type { WorkflowNodeDef } from './workflow.types';
import type { WorkflowNodeInputByAction } from './workflow-node-input.types';

/**
 * Runtime 读节点 input：有 irConfig 时以 IR config 为真源再推导；
 * 否则用物化/legacy def.input（§4.1e native executor 入口）。
 */
export function resolveWorkflowNodeRuntimeInput<
  A extends WorkflowNodeDef['action'],
>(def: WorkflowNodeDef<A>): WorkflowNodeInputByAction[A] {
  if (def.irType != null && def.irConfig != null) {
    const derived = deriveWorkflowNodeInputFromIr({
      irType: def.irType,
      config: def.irConfig,
      action: def.action,
    });
    if (derived != null) {
      return derived as WorkflowNodeInputByAction[A];
    }
  }
  return def.input;
}
