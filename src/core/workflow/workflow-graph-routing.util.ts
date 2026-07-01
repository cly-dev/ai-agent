import type { AgentGraphState } from '../agent-engine/engine/main/types/agent-engine.types';
import { shouldRouteToRespond } from '../agent-engine/engine/turn/turn-graph.util';
import { workflowNodeRequiresReactLoop } from './workflow-plan-sync.util';
import type { WorkflowNodeDef } from './workflow.types';

export function getWorkflowNodeDef(
  defs: WorkflowNodeDef[] | undefined,
  nodeId: string | null | undefined,
): WorkflowNodeDef | undefined {
  if (!defs || !nodeId) {
    return undefined;
  }
  return defs.find((row) => row.id === nodeId);
}

export function getCurrentWorkflowNode(state: AgentGraphState) {
  const run = state.workflowRun;
  if (!run?.currentNodeId) {
    return null;
  }
  return run.nodes.find((node) => node.nodeId === run.currentNodeId) ?? null;
}

export function routeAfterWorkflowInit(
  state: AgentGraphState,
): 'summarize' | 'execute_node' | '__end__' {
  if (state.finished) {
    return '__end__';
  }
  if (shouldRouteToRespond(state)) {
    return 'summarize';
  }
  if (!state.workflowRun?.currentNodeId) {
    return 'summarize';
  }
  return 'execute_node';
}

export function routeAfterExecuteNode(
  state: AgentGraphState,
): 'workflow_advance' | 'workflow_react' | 'summarize' | '__end__' {
  if (state.finished) {
    return '__end__';
  }
  if (shouldRouteToRespond(state)) {
    return 'summarize';
  }
  const current = getCurrentWorkflowNode(state);
  if (current?.status === 'failed') {
    return '__end__';
  }
  if (current?.status === 'succeeded' || current?.status === 'skipped') {
    return 'workflow_advance';
  }
  if (state.workflowAwaitingReact) {
    return 'workflow_react';
  }
  const def = getWorkflowNodeDef(
    state.workflowNodeDefs,
    state.workflowRun?.currentNodeId,
  );
  if (def?.action === 'summarize' || def?.action === 'present_mutation') {
    return 'summarize';
  }
  if (workflowNodeRequiresReactLoop(def)) {
    return 'workflow_react';
  }
  return 'workflow_advance';
}

export function routeAfterWorkflowReact(
  state: AgentGraphState,
): 'workflow_advance' | 'execute_node' | 'summarize' | '__end__' {
  if (state.finished) {
    return '__end__';
  }
  if (shouldRouteToRespond(state)) {
    return 'summarize';
  }
  const current = getCurrentWorkflowNode(state);
  if (current?.status === 'failed') {
    return '__end__';
  }
  if (current?.status === 'succeeded' || current?.status === 'skipped') {
    return 'workflow_advance';
  }
  if (!state.workflowAwaitingReact) {
    if (current?.status === 'pending' || current?.status === 'running') {
      return 'execute_node';
    }
    return 'workflow_advance';
  }
  return 'summarize';
}

export function routeAfterWorkflowAdvance(
  state: AgentGraphState,
): 'execute_node' | 'summarize' | '__end__' {
  if (state.finished) {
    return '__end__';
  }
  const run = state.workflowRun;
  if (!run || run.status === 'failed' || run.status === 'cancelled') {
    return '__end__';
  }
  if (run.status === 'completed' || !run.currentNodeId) {
    return '__end__';
  }
  return 'execute_node';
}

export function routeAfterSummarizeWorkflowAxis(
  state: AgentGraphState,
  resumeFromWriteConfirm: boolean,
): 'workflow_advance' | 'workflow_react' | 'tools' | 'execute_node' | '__end__' {
  if (state.finished || resumeFromWriteConfirm) {
    return '__end__';
  }
  if (state.pendingToolCalls.length > 0) {
    return 'tools';
  }
  const run = state.workflowRun;
  if (run && run.status === 'running' && run.currentNodeId) {
    const current = getCurrentWorkflowNode(state);
    if (current?.status === 'succeeded' || current?.status === 'skipped') {
      return 'workflow_advance';
    }
    if (state.workflowAwaitingReact) {
      return 'workflow_react';
    }
    if (current?.status === 'pending' || current?.status === 'running') {
      return 'execute_node';
    }
  }
  return '__end__';
}

export function routeResultCheckWorkflowAxis(
  state: AgentGraphState,
): 'workflow_advance' | null {
  if (!state.workflowRun?.currentNodeId) {
    return null;
  }
  const current = getCurrentWorkflowNode(state);
  if (current?.status === 'succeeded' || current?.status === 'skipped') {
    return 'workflow_advance';
  }
  return null;
}
