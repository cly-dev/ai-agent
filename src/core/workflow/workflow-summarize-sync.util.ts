import type { AgentGraphState } from '../agent-engine/engine/main/types/agent-engine.types';
import { getWorkflowNodeDef } from './workflow-graph-routing.util';
import {
  completeWorkflowNodeFromSummarize,
} from './workflow-plan-sync.util';
import {
  advanceWorkflowRun,
  finalizeWorkflowRun,
} from './workflow-run.util';
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
 * present_mutation 预览后须 advance 到 await_user_confirm，即使 plan 仍 continue。
 * 终端 summarize 节点在 continuePlan 时保持 running，待 plan 全走完再 advance。
 */
function shouldCompleteWorkflowNodeAfterSummarize(
  action: WorkflowActionKind,
  input: { continuePlan: boolean; finished: boolean },
): boolean {
  if (action === 'present_mutation') {
    return true;
  }
  if (action === 'summarize') {
    return input.finished || !input.continuePlan;
  }
  return false;
}

function findWorkflowNodeIdByAction(
  defs: AgentGraphState['workflowNodeDefs'],
  action: WorkflowActionKind,
): string | null {
  const row = defs?.find((node) => node.action === action);
  return row?.id ?? null;
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
  const presentNodeId =
    input.summarizedPlanStepId &&
    getWorkflowNodeDef(state.workflowNodeDefs, input.summarizedPlanStepId)
      ?.action === 'present_mutation'
      ? input.summarizedPlanStepId
      : findWorkflowNodeIdByAction(state.workflowNodeDefs, 'present_mutation');
  if (!presentNodeId) {
    return run;
  }

  const currentDef = getWorkflowNodeDef(
    state.workflowNodeDefs,
    run.currentNodeId,
  );
  if (currentDef?.action === 'present_mutation' && run.currentNodeId === presentNodeId) {
    return run;
  }

  let aligned = run;
  const composeNodeId = findWorkflowNodeIdByAction(
    state.workflowNodeDefs,
    'compose_mutation',
  );
  if (composeNodeId && !isNodeTerminal(aligned, composeNodeId)) {
    aligned = completeWorkflowNodeFromSummarize(
      aligned,
      composeNodeId,
      `obs:step:${composeNodeId}`,
    );
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
  if (!shouldCompleteWorkflowNodeAfterSummarize(action, input)) {
    return run !== state.workflowRun ? { workflowRun: run, workflowAwaitingReact: false } : {};
  }

  let workflowRun = completeWorkflowNodeFromSummarize(
    run,
    nodeId,
    summarizeCompletionOutputRef(action, nodeId),
  );
  workflowRun = advanceWorkflowRun(workflowRun);
  if (workflowRun.currentNodeId == null && workflowRun.status === 'running') {
    workflowRun = finalizeWorkflowRun(workflowRun, 'completed');
  }
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
