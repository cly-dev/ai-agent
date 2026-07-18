import type {
  WorkflowEdge,
  WorkflowNodeDef,
  WorkflowRunCompiledFrom,
  WorkflowRunState,
  WorkflowRunStatus,
} from './workflow.types';
import {
  advanceWorkflowRunAlongEdges,
  resolveEntryNodeId,
} from './graph/workflow-run-advance.util';
import { synthesizeLinearWorkflowEdges } from './graph/workflow-edge.util';
import type { WorkflowIrNode } from './workflow-ir.types';
import {
  actionForWorkflowIrNativePhase,
  materializeWorkflowIrNodeForPhase,
  nextWorkflowIrNativePhase,
} from './workflow-ir-native-phase.util';

export function cloneWorkflowRun(run: WorkflowRunState): WorkflowRunState {
  return {
    ...run,
    nodes: run.nodes.map((node) => ({ ...node })),
    edges: run.edges?.map((edge) => ({
      ...edge,
      clue: edge.clue ? { ...edge.clue } : undefined,
    })),
    routing: run.routing
      ? { pendingNodeIds: [...run.routing.pendingNodeIds] }
      : undefined,
  };
}

function findNodeIndex(run: WorkflowRunState, nodeId: string): number {
  return run.nodes.findIndex((node) => node.nodeId === nodeId);
}

function assertNodeExists(run: WorkflowRunState, nodeId: string): number {
  const index = findNodeIndex(run, nodeId);
  if (index < 0) {
    throw new Error(`workflow node not found: ${nodeId}`);
  }
  return index;
}

export function initWorkflowRun(input: {
  workflowId: number;
  version: number;
  nodes: WorkflowNodeDef[];
  edges?: WorkflowEdge[] | null;
  entryNodeId?: string | null;
  compiledFrom?: WorkflowRunCompiledFrom;
  now?: string;
  /** Plan A：native 入口相位（nodeId → phase） */
  phasesByNodeId?: Record<
    string,
    import('./workflow-ir-native-phase.util').WorkflowIrNativePhase
  >;
}): WorkflowRunState {
  if (input.nodes.length === 0) {
    throw new Error('workflow must contain at least one node');
  }

  // irNodeId/irType 从物化 def 带入 run；native 多相位写 phase（§4.3f）。
  const runNodes = input.nodes.map((node) => ({
    nodeId: node.id,
    action: node.action,
    name: node.name,
    status: 'pending' as const,
    ...(node.irNodeId ? { irNodeId: node.irNodeId } : {}),
    ...(node.irType ? { irType: node.irType } : {}),
    ...(input.phasesByNodeId?.[node.id]
      ? { phase: input.phasesByNodeId[node.id] }
      : {}),
  }));

  const edges =
    input.edges != null
      ? input.edges
      : synthesizeLinearWorkflowEdges(input.nodes);

  return {
    workflowId: input.workflowId,
    version: input.version,
    currentNodeId: resolveEntryNodeId({
      nodes: input.nodes,
      entryNodeId: input.entryNodeId,
    }),
    status: 'running',
    compiledFrom: input.compiledFrom,
    nodes: runNodes,
    edges,
  };
}

export function startWorkflowNode(
  run: WorkflowRunState,
  nodeId: string,
  now: string = new Date().toISOString(),
): WorkflowRunState {
  const next = cloneWorkflowRun(run);
  const index = assertNodeExists(next, nodeId);
  const node = next.nodes[index];
  if (node.status !== 'pending' && node.status !== 'running') {
    throw new Error(`cannot start node in status ${node.status}`);
  }
  node.status = 'running';
  node.startedAt = node.startedAt ?? now;
  next.currentNodeId = nodeId;
  return next;
}

export function completeWorkflowNode(
  run: WorkflowRunState,
  nodeId: string,
  outputRef?: string,
  now: string = new Date().toISOString(),
): WorkflowRunState {
  const next = cloneWorkflowRun(run);
  const index = assertNodeExists(next, nodeId);
  const node = next.nodes[index];
  node.status = 'succeeded';
  node.finishedAt = now;
  if (outputRef != null) {
    node.outputRef = outputRef;
  }
  return next;
}

export function completeWorkflowNodeOrAdvancePhase(input: {
  run: WorkflowRunState;
  nodeId: string;
  irNode: WorkflowIrNode;
  outputRef?: string;
  now?: string;
}): {
  workflowRun: WorkflowRunState;
  advancedPhase: boolean;
} {
  const now = input.now ?? new Date().toISOString();
  const current = input.run.nodes.find((n) => n.nodeId === input.nodeId);
  const currentPhase = current?.phase ?? 'execute';
  const nextPhase = nextWorkflowIrNativePhase(input.irNode, currentPhase);
  if (nextPhase == null) {
    return {
      workflowRun: completeWorkflowNode(
        input.run,
        input.nodeId,
        input.outputRef,
        now,
      ),
      advancedPhase: false,
    };
  }

  const next = cloneWorkflowRun(input.run);
  const index = assertNodeExists(next, input.nodeId);
  const node = next.nodes[index];
  const phaseDef = materializeWorkflowIrNodeForPhase(input.irNode, nextPhase);
  node.phase = nextPhase;
  node.action = actionForWorkflowIrNativePhase(input.irNode, nextPhase);
  node.name = phaseDef.name;
  node.status = 'pending';
  delete node.startedAt;
  delete node.finishedAt;
  delete node.outputRef;
  delete node.error;
  next.currentNodeId = input.nodeId;
  next.status = 'running';
  return { workflowRun: next, advancedPhase: true };
}

/**
 * 节点已 succeeded 后：若还有下一相位，回退为 pending 并切换相位；
 * 否则不动（由调用方 edge advance）。
 */
export function tryAdvanceNativePhaseAfterNodeSuccess(input: {
  run: WorkflowRunState;
  nodeId: string;
  irNode: WorkflowIrNode;
}): {
  workflowRun: WorkflowRunState;
  advancedPhase: boolean;
} {
  const current = input.run.nodes.find((n) => n.nodeId === input.nodeId);
  const currentPhase = current?.phase ?? 'execute';
  const nextPhase = nextWorkflowIrNativePhase(input.irNode, currentPhase);
  if (nextPhase == null) {
    return { workflowRun: input.run, advancedPhase: false };
  }
  return completeWorkflowNodeOrAdvancePhase({
    run: input.run,
    nodeId: input.nodeId,
    irNode: input.irNode,
  });
}

export function failWorkflowNode(
  run: WorkflowRunState,
  nodeId: string,
  error: { code: string; message: string },
  now: string = new Date().toISOString(),
): WorkflowRunState {
  const next = cloneWorkflowRun(run);
  const index = assertNodeExists(next, nodeId);
  const node = next.nodes[index];
  node.status = 'failed';
  node.finishedAt = now;
  node.error = error;
  next.status = 'failed';
  next.currentNodeId = nodeId;
  return next;
}

export function skipWorkflowNode(
  run: WorkflowRunState,
  nodeId: string,
  now: string = new Date().toISOString(),
): WorkflowRunState {
  const next = cloneWorkflowRun(run);
  const index = assertNodeExists(next, nodeId);
  const node = next.nodes[index];
  node.status = 'skipped';
  node.finishedAt = now;
  return next;
}

/**
 * 推进工作流。优先使用 run.edges；也可显式传入 edges 覆盖。
 * 无边时按 nodes 顺序合成 always 边后再推进（单节点则边为空，等价无下一跳）。
 */
export function advanceWorkflowRun(
  run: WorkflowRunState,
  edges?: WorkflowEdge[] | null,
): WorkflowRunState {
  if (run.status === 'failed' || run.status === 'cancelled') {
    return run;
  }

  const resolvedEdges =
    edges != null
      ? edges
      : run.edges != null
        ? run.edges
        : synthesizeLinearWorkflowEdges(
            run.nodes.map((node) => ({
              id: node.nodeId,
              action: node.action,
              name: node.name,
              objective: '',
              input: {},
            })) as WorkflowNodeDef[],
          );

  return advanceWorkflowRunAlongEdges({ run, edges: resolvedEdges });
}

export function finalizeWorkflowRun(
  run: WorkflowRunState,
  status: Extract<WorkflowRunStatus, 'completed' | 'failed' | 'cancelled'>,
): WorkflowRunState {
  const next = cloneWorkflowRun(run);
  next.status = status;
  if (status === 'completed') {
    next.currentNodeId = null;
  }
  return next;
}

export function getWorkflowRunNode(
  run: WorkflowRunState,
  nodeId: string,
): WorkflowRunState['nodes'][number] | null {
  return run.nodes.find((node) => node.nodeId === nodeId) ?? null;
}

export function allWorkflowNodesTerminal(run: WorkflowRunState): boolean {
  return run.nodes.every(
    (node) =>
      node.status === 'succeeded' ||
      node.status === 'failed' ||
      node.status === 'skipped',
  );
}

/**
 * advance 后无下一节点时收尾：全部终态 → completed；仍有 pending → failed。
 * 正常状态分支在 routing 时应已 skip 干净；此处防漏网孤儿被标 completed。
 */
export function finalizeWorkflowRunAfterAdvance(
  run: WorkflowRunState,
): WorkflowRunState {
  if (run.status !== 'running' || run.currentNodeId != null) {
    return run;
  }
  if (allWorkflowNodesTerminal(run)) {
    return finalizeWorkflowRun(run, 'completed');
  }
  const pendingIds = run.nodes
    .filter((node) => node.status === 'pending')
    .map((node) => node.nodeId);
  const next = finalizeWorkflowRun(run, 'failed');
  const now = new Date().toISOString();
  // 漏网 pending：首个标失败带原因，其余 skip，避免半终态残留
  for (let i = 0; i < pendingIds.length; i += 1) {
    const nodeId = pendingIds[i]!;
    const index = next.nodes.findIndex((node) => node.nodeId === nodeId);
    if (index < 0) {
      continue;
    }
    if (i === 0) {
      next.nodes[index] = {
        ...next.nodes[index],
        status: 'failed',
        finishedAt: now,
        error: {
          code: 'WORKFLOW_ORPHAN_PENDING',
          message: `workflow ended with pending nodes: ${pendingIds.join(', ')}`,
        },
      };
      next.currentNodeId = nodeId;
      continue;
    }
    next.nodes[index] = {
      ...next.nodes[index],
      status: 'skipped',
      finishedAt: now,
    };
  }
  return next;
}
