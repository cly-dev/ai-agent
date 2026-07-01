import type {
  WorkflowNodeDef,
  WorkflowRunCompiledFrom,
  WorkflowRunState,
  WorkflowRunStatus,
} from './workflow.types';

function cloneRun(run: WorkflowRunState): WorkflowRunState {
  return {
    ...run,
    nodes: run.nodes.map((node) => ({ ...node })),
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

function nextPendingNodeId(
  run: WorkflowRunState,
  afterNodeId: string | null,
): string | null {
  const startIndex =
    afterNodeId == null ? 0 : findNodeIndex(run, afterNodeId) + 1;
  for (let index = startIndex; index < run.nodes.length; index += 1) {
    const node = run.nodes[index];
    if (node.status === 'pending') {
      return node.nodeId;
    }
  }
  return null;
}

export function initWorkflowRun(input: {
  workflowId: number;
  version: number;
  nodes: WorkflowNodeDef[];
  compiledFrom?: WorkflowRunCompiledFrom;
  now?: string;
}): WorkflowRunState {
  if (input.nodes.length === 0) {
    throw new Error('workflow must contain at least one node');
  }

  const runNodes = input.nodes.map((node) => ({
    nodeId: node.id,
    action: node.action,
    name: node.name,
    status: 'pending' as const,
  }));

  return {
    workflowId: input.workflowId,
    version: input.version,
    currentNodeId: input.nodes[0]?.id ?? null,
    status: 'running',
    compiledFrom: input.compiledFrom,
    nodes: runNodes,
  };
}

export function startWorkflowNode(
  run: WorkflowRunState,
  nodeId: string,
  now: string = new Date().toISOString(),
): WorkflowRunState {
  const next = cloneRun(run);
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
  const next = cloneRun(run);
  const index = assertNodeExists(next, nodeId);
  const node = next.nodes[index];
  node.status = 'succeeded';
  node.finishedAt = now;
  if (outputRef != null) {
    node.outputRef = outputRef;
  }
  return next;
}

export function failWorkflowNode(
  run: WorkflowRunState,
  nodeId: string,
  error: { code: string; message: string },
  now: string = new Date().toISOString(),
): WorkflowRunState {
  const next = cloneRun(run);
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
  const next = cloneRun(run);
  const index = assertNodeExists(next, nodeId);
  const node = next.nodes[index];
  node.status = 'skipped';
  node.finishedAt = now;
  return next;
}

export function advanceWorkflowRun(run: WorkflowRunState): WorkflowRunState {
  if (run.status === 'failed' || run.status === 'cancelled') {
    return run;
  }

  const next = cloneRun(run);
  const currentId = next.currentNodeId;
  if (currentId != null) {
    const current = next.nodes[findNodeIndex(next, currentId)];
    if (
      current &&
      current.status !== 'succeeded' &&
      current.status !== 'skipped'
    ) {
      throw new Error(
        `cannot advance: current node ${currentId} is ${current.status}`,
      );
    }
  }

  const upcoming = nextPendingNodeId(next, currentId);
  next.currentNodeId = upcoming;
  return next;
}

export function finalizeWorkflowRun(
  run: WorkflowRunState,
  status: Extract<WorkflowRunStatus, 'completed' | 'failed' | 'cancelled'>,
): WorkflowRunState {
  const next = cloneRun(run);
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
