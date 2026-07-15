import type {
  DetectCluesOutput,
  WorkflowEdge,
  WorkflowRunState,
} from '../workflow.types';
import {
  findDefaultEdgeFrom,
  listAlwaysEdgesFrom,
  listClueEdgesFrom,
  listOutgoingEdges,
} from './workflow-edge.util';

function cloneRun(run: WorkflowRunState): WorkflowRunState {
  return {
    ...run,
    nodes: run.nodes.map((node) => ({ ...node })),
    routing: run.routing
      ? { pendingNodeIds: [...run.routing.pendingNodeIds] }
      : undefined,
  };
}

function skipPendingNode(
  run: WorkflowRunState,
  nodeId: string,
  now: string,
): WorkflowRunState {
  const node = run.nodes.find((row) => row.nodeId === nodeId);
  if (!node || node.status !== 'pending') {
    return run;
  }
  const next = cloneRun(run);
  const target = next.nodes.find((row) => row.nodeId === nodeId)!;
  target.status = 'skipped';
  target.finishedAt = now;
  return next;
}

/** 从 roots 沿 always 出边可达的节点（含 roots）——命中路径 / 汇合。 */
function collectAlwaysReachable(
  roots: Iterable<string>,
  edges: WorkflowEdge[],
): Set<string> {
  const reachable = new Set<string>();
  const stack = [...roots];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (reachable.has(id)) {
      continue;
    }
    reachable.add(id);
    for (const edge of listAlwaysEdgesFrom(edges, id)) {
      stack.push(edge.to);
    }
  }
  return reachable;
}

/**
 * 从 roots 沿全部出边（always/clue/default）可达 —— 用于 skip 未启用子树
 *（含嵌套 detect 的扇出目标，仅 always 会漏掉）。
 */
function collectAllOutboundReachable(
  roots: Iterable<string>,
  edges: WorkflowEdge[],
): Set<string> {
  const reachable = new Set<string>();
  const stack = [...roots];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (reachable.has(id)) {
      continue;
    }
    reachable.add(id);
    for (const edge of listOutgoingEdges(edges, id)) {
      stack.push(edge.to);
    }
  }
  return reachable;
}

/**
 * 状态识别路由：按 matched 状态启用目标；可嵌套多个 detect。
 *
 * 1. enabledRoots = 命中状态的 to；零命中则用 default.to
 * 2. 先取本 detect 完成前的外层 pending 兄弟（嵌套时勿被 cascade 误 skip）
 * 3. protected = enabledRoots ∪ 外层兄弟 及其 always 后代（含汇合）
 * 4. 仅对本 detect 未启用分支 cascade skip（沿全部出边；与 protected 求差）
 * 5. pending = 本检测扇出根 + 仍 pending 的外层兄弟
 */
export function applyDetectCluesRouting(input: {
  run: WorkflowRunState;
  edges: WorkflowEdge[];
  fromNodeId: string;
  output: DetectCluesOutput;
  now?: string;
}): WorkflowRunState {
  const now = input.now ?? new Date().toISOString();
  let next = cloneRun(input.run);
  const matchedKeys = new Set(input.output.matchedClueKeys);
  const clueEdges = listClueEdgesFrom(input.edges, input.fromNodeId);
  const defaultEdge = findDefaultEdgeFrom(input.edges, input.fromNodeId);

  const matchedTargets: string[] = [];
  const unmatchedRoots: string[] = [];
  const seenMatched = new Set<string>();
  const seenUnmatched = new Set<string>();

  for (const edge of clueEdges) {
    const key = edge.clue?.key;
    if (!key) {
      continue;
    }
    if (matchedKeys.has(key)) {
      if (!seenMatched.has(edge.to)) {
        seenMatched.add(edge.to);
        matchedTargets.push(edge.to);
      }
      continue;
    }
    if (!seenUnmatched.has(edge.to)) {
      seenUnmatched.add(edge.to);
      unmatchedRoots.push(edge.to);
    }
  }

  const hasMatch = matchedTargets.length > 0;
  const enabledRoots = hasMatch
    ? matchedTargets
    : defaultEdge
      ? [defaultEdge.to]
      : [];

  // skip 前冻结外层队列：钻石多入边时，外层兄弟可能落在内层未命中子树可达集内
  const outerSiblingRoots = (next.routing?.pendingNodeIds ?? []).filter(
    (nodeId) =>
      nodeId !== input.fromNodeId && !enabledRoots.includes(nodeId),
  );
  const protectedIds = collectAlwaysReachable(
    [...enabledRoots, ...outerSiblingRoots],
    input.edges,
  );

  const skipRoots = [...unmatchedRoots];
  if (hasMatch && defaultEdge) {
    skipRoots.push(defaultEdge.to);
  }
  const skipCandidates = collectAllOutboundReachable(skipRoots, input.edges);
  for (const nodeId of skipCandidates) {
    if (protectedIds.has(nodeId)) {
      continue;
    }
    next = skipPendingNode(next, nodeId, now);
  }

  const siblingPending = outerSiblingRoots.filter((nodeId) =>
    next.nodes.some(
      (row) => row.nodeId === nodeId && row.status === 'pending',
    ),
  );

  next.routing =
    enabledRoots.length > 0 || siblingPending.length > 0
      ? { pendingNodeIds: [...enabledRoots, ...siblingPending] }
      : undefined;
  return next;
}

/**
 * 边驱动推进：先跟当前分支 always，再 dequeue 下一扇出根。
 */
export function advanceWorkflowRunAlongEdges(input: {
  run: WorkflowRunState;
  edges: WorkflowEdge[];
}): WorkflowRunState {
  const run = input.run;
  if (run.status === 'failed' || run.status === 'cancelled') {
    return run;
  }

  const next = cloneRun(run);
  const currentId = next.currentNodeId;
  if (currentId != null) {
    const current = next.nodes.find((row) => row.nodeId === currentId);
    if (
      current &&
      current.status !== 'succeeded' &&
      current.status !== 'skipped'
    ) {
      throw new Error(
        `cannot advance: current node ${currentId} is ${current.status}`,
      );
    }

    const alwaysEdges = listAlwaysEdgesFrom(input.edges, currentId);
    for (const edge of alwaysEdges) {
      const target = next.nodes.find((row) => row.nodeId === edge.to);
      if (target?.status === 'pending') {
        next.currentNodeId = edge.to;
        return next;
      }
    }
  }

  const pending = next.routing?.pendingNodeIds ?? [];
  if (pending.length > 0) {
    const [upcoming, ...rest] = pending;
    next.currentNodeId = upcoming ?? null;
    next.routing =
      rest.length > 0 ? { pendingNodeIds: rest } : undefined;
    return next;
  }

  next.currentNodeId = null;
  return next;
}

export function resolveEntryNodeId(input: {
  nodes: { id: string }[];
  entryNodeId?: string | null;
}): string | null {
  if (
    input.entryNodeId &&
    input.nodes.some((node) => node.id === input.entryNodeId)
  ) {
    return input.entryNodeId;
  }
  return input.nodes[0]?.id ?? null;
}
