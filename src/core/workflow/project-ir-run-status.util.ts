import type { WorkflowIrNodeType } from './workflow-ir.types';
import type {
  WorkflowNodeStatus,
  WorkflowRunNodeState,
  WorkflowRunState,
} from './workflow.types';

/**
 * IR 粒度节点投影（§4.1e）：多个物化子步（同 irNodeId）聚合成一个逻辑节点状态。
 * advance 仍按物化 nodeId 推进；本投影仅供审计 / SSE / 观测，不改调度。
 */
export type IrRunNodeProjection = {
  irNodeId: string;
  irType?: WorkflowIrNodeType;
  /** 物化子步 id，顺序与 run.nodes 出现序一致 */
  stepNodeIds: string[];
  status: WorkflowNodeStatus;
  current: boolean;
};

function aggregateExpandStepStatuses(
  statuses: readonly WorkflowNodeStatus[],
): WorkflowNodeStatus {
  if (statuses.length === 0) {
    return 'pending';
  }
  if (statuses.some((s) => s === 'failed')) {
    return 'failed';
  }
  if (statuses.some((s) => s === 'running')) {
    return 'running';
  }
  if (statuses.every((s) => s === 'skipped')) {
    return 'skipped';
  }
  if (statuses.every((s) => s === 'succeeded' || s === 'skipped')) {
    return 'succeeded';
  }
  if (statuses.some((s) => s === 'succeeded' || s === 'skipped')) {
    // 部分终态、其余仍 pending：IR 节点视为进行中
    return 'running';
  }
  return 'pending';
}

function groupKey(node: WorkflowRunNodeState): string {
  return node.irNodeId ?? node.nodeId;
}

/** 将 run.nodes 按 irNodeId 聚合；无 irNodeId 时退化为物化 nodeId 一行。 */
export function projectIrRunNodeStatuses(
  run: WorkflowRunState,
): IrRunNodeProjection[] {
  const order: string[] = [];
  const groups = new Map<
    string,
    {
      irType?: WorkflowIrNodeType;
      stepNodeIds: string[];
      statuses: WorkflowNodeStatus[];
    }
  >();

  for (const node of run.nodes) {
    const key = groupKey(node);
    let group = groups.get(key);
    if (!group) {
      group = {
        irType: node.irType,
        stepNodeIds: [],
        statuses: [],
      };
      groups.set(key, group);
      order.push(key);
    }
    group.stepNodeIds.push(node.nodeId);
    group.statuses.push(node.status);
    if (!group.irType && node.irType) {
      group.irType = node.irType;
    }
  }

  const currentId = run.currentNodeId;
  return order.map((irNodeId) => {
    const group = groups.get(irNodeId)!;
    return {
      irNodeId,
      irType: group.irType,
      stepNodeIds: group.stepNodeIds,
      status: aggregateExpandStepStatuses(group.statuses),
      current: currentId != null && group.stepNodeIds.includes(currentId),
    };
  });
}

/** 当前物化步对应的 IR 节点 id；无打标时等于 currentNodeId。 */
export function resolveCurrentIrNodeId(run: WorkflowRunState): string | null {
  const currentId = run.currentNodeId;
  if (currentId == null) {
    return null;
  }
  const node = run.nodes.find((row) => row.nodeId === currentId);
  return node?.irNodeId ?? currentId;
}
