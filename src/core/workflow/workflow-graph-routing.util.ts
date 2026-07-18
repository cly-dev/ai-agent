import type { WorkflowNodeDef } from './workflow.types';
import type { WorkflowIrDocument } from './workflow-ir.types';
import type { WorkflowExecutionMode } from './workflow-ir-native-direct.util';
import {
  materializeWorkflowIrNodeForPhase,
  resolveWorkflowIrNativePhases,
} from './workflow-ir-native-phase.util';
import type { AgentGraphState } from '../agent-engine/engine/main/types/agent-engine.types';
import { shouldRouteToRespond } from '../agent-engine/engine/turn/turn-graph.util';
import { workflowNodeRequiresReactLoop } from './workflow-plan-sync.util';

export function getWorkflowNodeDef(
  defs: WorkflowNodeDef[] | undefined,
  nodeId: string | null | undefined,
): WorkflowNodeDef | undefined {
  if (!defs || !nodeId) {
    return undefined;
  }
  return defs.find((row) => row.id === nodeId);
}

/**
 * Plan A：native 按 IR + 当前 phase 合成 def；否则回退 workflowNodeDefs。
 */
export function resolveWorkflowNodeDefForExecute(input: {
  nodeId: string;
  defs?: WorkflowNodeDef[] | null;
  ir?: WorkflowIrDocument | null;
  executionMode?: WorkflowExecutionMode | null;
  phase?: import('./workflow-ir-native-phase.util').WorkflowIrNativePhase | null;
}): WorkflowNodeDef | undefined {
  if (input.executionMode === 'ir_native_direct' && input.ir) {
    const irNode = input.ir.nodes.find((row) => row.id === input.nodeId);
    if (irNode) {
      try {
        const phase =
          input.phase ??
          resolveWorkflowIrNativePhases(irNode)[0]!;
        return materializeWorkflowIrNodeForPhase(irNode, phase);
      } catch {
        return undefined;
      }
    }
  }
  return getWorkflowNodeDef(input.defs ?? undefined, input.nodeId);
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
  const nodeId = state.workflowRun?.currentNodeId;
  if (!nodeId) {
    return 'workflow_advance';
  }
  // 须带当前 phase：缺省会落到入口 present，在 await 相位误路由到 summarize。
  const def = resolveWorkflowNodeDefForExecute({
    nodeId,
    defs: state.workflowNodeDefs,
    ir: state.workflowIr,
    executionMode: state.workflowExecutionMode,
    phase: current?.phase,
  });
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
