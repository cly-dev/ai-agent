import type { AgentGraphState } from '../agent-engine/engine/main/types/agent-engine.types';
import { getWorkflowNodeDef } from './workflow-graph-routing.util';
import {
  completeWorkflowNodeFromSummarize,
} from './workflow-plan-sync.util';
import {
  advanceWorkflowRun,
  finalizeWorkflowRunAfterAdvance,
} from './workflow-run.util';
import { listAlwaysEdgesFrom } from './graph/workflow-edge.util';
import type { WorkflowActionKind, WorkflowRunState } from './workflow.types';

function summarizeCompletionOutputRef(action: WorkflowActionKind, nodeId: string): string {
  if (action === 'present_mutation') {
    return `obs:present_mutation:${nodeId}`;
  }
  return `obs:summarize:${nodeId}`;
}

/** Summarize 图节点完成时，哪些 workflow action 应 mark succeeded 并 advance。 */
function isWorkflowSummarizeCompletionAction(
  action: WorkflowActionKind | undefined,
): action is 'summarize' | 'present_mutation' {
  return action === 'summarize' || action === 'present_mutation';
}

/**
 * present_mutation：始终 complete+advance（预览后要进 await）。
 * summarize：plan 结束时 complete；若仍有扇出兄弟或 always 后续 pending，也必须 complete，
 * 否则独立分支叶会卡死（线性「continuePlan 保持 running」仅在无后续图边时保留）。
 */
function shouldCompleteWorkflowNodeAfterSummarize(
  action: WorkflowActionKind,
  run: WorkflowRunState,
  input: { continuePlan: boolean; finished: boolean },
): boolean {
  if (action === 'present_mutation') {
    return true;
  }
  if (action !== 'summarize') {
    return false;
  }
  if (input.finished || !input.continuePlan) {
    return true;
  }
  if ((run.routing?.pendingNodeIds?.length ?? 0) > 0) {
    return true;
  }
  const currentId = run.currentNodeId;
  if (!currentId || !run.edges?.length) {
    return false;
  }
  return listAlwaysEdgesFrom(run.edges, currentId).some((edge) => {
    const target = run.nodes.find((row) => row.nodeId === edge.to);
    return target?.status === 'pending';
  });
}

/**
 * 按当前/指定 id 解析 action 节点，避免多分支下 first-by-action 挂错。
 */
function resolveWorkflowNodeIdByAction(
  defs: AgentGraphState['workflowNodeDefs'],
  run: WorkflowRunState,
  action: WorkflowActionKind,
  preferredId?: string | null,
): string | null {
  if (preferredId) {
    const preferred = getWorkflowNodeDef(defs, preferredId);
    if (preferred?.action === action) {
      return preferredId;
    }
  }
  const currentId = run.currentNodeId;
  if (currentId) {
    const current = getWorkflowNodeDef(defs, currentId);
    if (current?.action === action) {
      return currentId;
    }
  }
  const candidates = (defs ?? []).filter((node) => node.action === action);
  if (candidates.length === 0) {
    return null;
  }
  if (candidates.length === 1) {
    return candidates[0]!.id;
  }
  const active = candidates.find((node) => {
    const row = run.nodes.find((n) => n.nodeId === node.id);
    return row?.status === 'pending' || row?.status === 'running';
  });
  return active?.id ?? candidates[0]!.id;
}

function isNodeTerminal(
  run: WorkflowRunState,
  nodeId: string,
): boolean {
  const node = run.nodes.find((row) => row.nodeId === nodeId);
  return node?.status === 'succeeded' || node?.status === 'skipped';
}

/**
 * Plan present summarize 完成时，将可能落后的 workflowRun 对齐到 present_mutation 再 complete。
 */
function alignWorkflowRunForPresentSummarize(
  state: AgentGraphState,
  input: { summarizedPlanStepId?: string | null },
): WorkflowRunState | null {
  const run = state.workflowRun;
  if (!run) {
    return null;
  }
  const presentNodeId = resolveWorkflowNodeIdByAction(
    state.workflowNodeDefs,
    run,
    'present_mutation',
    input.summarizedPlanStepId,
  );
  if (!presentNodeId) {
    return run;
  }

  if (run.currentNodeId === presentNodeId) {
    return run;
  }

  let aligned = run;
  const composeNodeId = resolveWorkflowNodeIdByAction(
    state.workflowNodeDefs,
    aligned,
    'compose_mutation',
  );
  if (composeNodeId && !isNodeTerminal(aligned, composeNodeId)) {
    // 仅当 compose 是 present 的紧邻前置（当前仍停在 compose）时补齐
    if (aligned.currentNodeId === composeNodeId) {
      aligned = completeWorkflowNodeFromSummarize(
        aligned,
        composeNodeId,
        `obs:step:${composeNodeId}`,
      );
    }
  }
  return { ...aligned, currentNodeId: presentNodeId };
}

export function applyWorkflowAfterSummarize(
  state: AgentGraphState,
  input: {
    continuePlan: boolean;
    finished: boolean;
    summarizedPlanStepId?: string | null;
  },
): Pick<AgentGraphState, 'workflowRun' | 'workflowAwaitingReact'> {
  let run = state.workflowRun;
  if (!run) {
    return {};
  }

  if (input.summarizedPlanStepId) {
    const presentDef = getWorkflowNodeDef(
      state.workflowNodeDefs,
      input.summarizedPlanStepId,
    );
    if (presentDef?.action === 'present_mutation') {
      run = alignWorkflowRunForPresentSummarize(state, input) ?? run;
    }
  }

  const nodeId = run.currentNodeId;
  if (!nodeId) {
    return { workflowRun: run };
  }

  const def = getWorkflowNodeDef(state.workflowNodeDefs, nodeId);
  const action = def?.action;
  if (!isWorkflowSummarizeCompletionAction(action)) {
    return run !== state.workflowRun ? { workflowRun: run, workflowAwaitingReact: false } : {};
  }
  if (!shouldCompleteWorkflowNodeAfterSummarize(action, run, input)) {
    return run !== state.workflowRun ? { workflowRun: run, workflowAwaitingReact: false } : {};
  }

  let workflowRun = completeWorkflowNodeFromSummarize(
    run,
    nodeId,
    summarizeCompletionOutputRef(action, nodeId),
  );
  workflowRun = advanceWorkflowRun(workflowRun);
  workflowRun = finalizeWorkflowRunAfterAdvance(workflowRun);
  return {
    workflowRun,
    workflowAwaitingReact: false,
  };
}

export function mergeWorkflowExecutorOutcome(
  state: AgentGraphState,
  input: {
    workflowRun: WorkflowRunState;
    outputRef?: string;
    nodeOutput?: unknown;
  },
): AgentGraphState {
  const outputs = { ...(state.workflowNodeOutputs ?? {}) };
  if (input.outputRef != null) {
    outputs[input.outputRef] = input.nodeOutput;
  }
  return {
    ...state,
    workflowRun: input.workflowRun,
    workflowNodeOutputs: outputs,
  };
}
