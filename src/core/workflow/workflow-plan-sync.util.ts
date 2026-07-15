import type { TaskPlanAdvanceResult, TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
import { advancePlanAfterStepComplete } from '../agent-engine/engine/main/plan/task-plan.util';
import { syncPlanFromActiveFrame, wrapSnapshotWithPlanStack } from '../agent-engine/engine/main/plan/plan-stack.util';
import { hydrateTaskPlanWithWorkflowDefs } from './workflow-resume.util';
import {
  advanceWorkflowRun,
  completeWorkflowNode,
  finalizeWorkflowRunAfterAdvance,
  startWorkflowNode,
} from './workflow-run.util';
import type { WorkflowNodeDef, WorkflowRunState } from './workflow.types';

export function newlyCompletedPlanStepIds(
  planBefore: TaskPlanSnapshot,
  planAfter: TaskPlanSnapshot,
): string[] {
  const before = new Set(planBefore.completedStepIds);
  return planAfter.completedStepIds.filter((id) => !before.has(id));
}

/**
 * Plan 侧「步完成」只用来 complete 对应 workflow 节点；下一跳一律走边 advance。
 * 禁止用 plan.currentStepId / nodes 声明序改写 currentNodeId（会跳过分支 always）。
 */
export function syncWorkflowRunAfterPlanAdvance(input: {
  workflowRun: WorkflowRunState;
  planBefore: TaskPlanSnapshot;
  planAdvance: TaskPlanAdvanceResult;
}): WorkflowRunState {
  let run = input.workflowRun;
  const completedIds = newlyCompletedPlanStepIds(
    input.planBefore,
    input.planAdvance.updatedPlan,
  );
  for (const stepId of completedIds) {
    if (run.nodes.some((node) => node.nodeId === stepId)) {
      run = completeWorkflowNode(run, stepId, `obs:step:${stepId}`);
    }
  }

  const planAfter = input.planAdvance.updatedPlan;
  const currentId = run.currentNodeId;
  if (currentId != null) {
    const active = run.nodes.find((node) => node.nodeId === currentId);
    const planMovedPast =
      planAfter.completedStepIds.includes(currentId) ||
      !planAfter.pendingStepIds.includes(currentId);
    if (active?.status === 'running' && planMovedPast) {
      run = completeWorkflowNode(run, currentId, `obs:step:${currentId}`);
    }
  }

  if (run.status !== 'running') {
    return run;
  }

  run = advanceWorkflowRun(run);
  return finalizeWorkflowRunAfterAdvance(run);
}

/**
 * workflowRun 为 SSOT：将 taskPlan 投影为镜像（唯一 plan 写入语义）。
 * 已完成步 = workflow 节点 succeeded/skipped ∪ plan 已 completed（Plan 侧先行推进时保留）。
 */
export function projectTaskPlanFromWorkflowRun(input: {
  taskPlan: TaskPlanSnapshot | null | undefined;
  workflowRun: WorkflowRunState;
  workflowNodeDefs?: WorkflowNodeDef[] | null;
}): TaskPlanSnapshot | null {
  if (!input.taskPlan) {
    return null;
  }
  const plan =
    hydrateTaskPlanWithWorkflowDefs({
      taskPlan: input.taskPlan,
      workflowNodeDefs: input.workflowNodeDefs,
    }) ?? input.taskPlan;

  const completedFromRun = new Set(
    input.workflowRun.nodes
      .filter(
        (row) => row.status === 'succeeded' || row.status === 'skipped',
      )
      .map((row) => row.nodeId),
  );
  const priorCompleted = new Set(plan.completedStepIds);
  const stepIds = plan.steps.map((row) => row.id);
  const completedStepIds = stepIds.filter(
    (id) => completedFromRun.has(id) || priorCompleted.has(id),
  );
  const completedSet = new Set(completedStepIds);
  const pendingStepIds = stepIds.filter((id) => !completedSet.has(id));

  const currentNodeId = input.workflowRun.currentNodeId;
  let orderedPending = pendingStepIds;
  if (currentNodeId && pendingStepIds.includes(currentNodeId)) {
    orderedPending = [
      currentNodeId,
      ...pendingStepIds.filter((id) => id !== currentNodeId),
    ];
  }

  const currentStepId =
    currentNodeId && plan.steps.some((row) => row.id === currentNodeId)
      ? currentNodeId
      : orderedPending[0] ?? null;
  const currentStep =
    currentStepId != null
      ? plan.steps.find((row) => row.id === currentStepId) ?? null
      : null;

  const projectedFields = {
    completedStepIds,
    pendingStepIds: orderedPending,
    currentStepId,
    currentObjective: currentStep?.objective ?? plan.currentObjective,
    taskPhase: currentStep?.phase ?? plan.taskPhase,
  };

  if (plan.frames.length === 0) {
    return { ...plan, ...projectedFields };
  }

  const frames = plan.frames.map((frame, index) =>
    index === plan.activeFrameIndex
      ? { ...frame, ...projectedFields }
      : frame,
  );
  return syncPlanFromActiveFrame({ ...plan, frames });
}

export function applyWorkflowTaskPlanProjection<
  T extends {
    taskPlan?: TaskPlanSnapshot | null;
    workflowRun?: WorkflowRunState | null;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
  },
>(state: T): T {
  if (!state.taskPlan || !state.workflowRun) {
    return state;
  }
  const taskPlan = projectTaskPlanFromWorkflowRun({
    taskPlan: state.taskPlan,
    workflowRun: state.workflowRun,
    workflowNodeDefs: state.workflowNodeDefs,
  });
  return taskPlan ? { ...state, taskPlan } : state;
}

export function deriveWorkflowAwaitingReact(input: {
  workflowRun?: WorkflowRunState | null;
  workflowNodeDefs?: WorkflowNodeDef[] | null;
}): boolean {
  const run = input.workflowRun;
  const nodeId = run?.currentNodeId;
  if (!run || !nodeId || run.status !== 'running') {
    return false;
  }
  const node = run.nodes.find((row) => row.nodeId === nodeId);
  if (node?.status !== 'running' && node?.status !== 'pending') {
    return false;
  }
  const def = input.workflowNodeDefs?.find((row) => row.id === nodeId);
  return workflowNodeRequiresReactLoop(def);
}

export function workflowNodeRequiresReactLoop(
  def: WorkflowNodeDef | undefined,
): boolean {
  if (!def) {
    return false;
  }
  return (
    def.action === 'fetch_data' ||
    def.action === 'generate_and_push' ||
    def.action === 'compose_mutation' ||
    def.action === 'write_data'
  );
}

/** workflowRun 为 SSOT；workflow_advance 完成后将 taskPlan 投影为镜像。 */
export function projectTaskPlanFromWorkflowAdvance(input: {
  taskPlan: TaskPlanSnapshot | null | undefined;
  completedNodeId: string;
}): TaskPlanSnapshot | null {
  return syncTaskPlanAfterWorkflowNodeComplete(input);
}

export function syncTaskPlanAfterWorkflowNodeComplete(input: {
  taskPlan: TaskPlanSnapshot | null | undefined;
  completedNodeId: string;
}): TaskPlanSnapshot | null {
  if (!input.taskPlan) {
    return null;
  }
  if (input.taskPlan.completedStepIds.includes(input.completedNodeId)) {
    return input.taskPlan;
  }
  const hasStep = input.taskPlan.steps.some(
    (row) => row.id === input.completedNodeId,
  );
  if (!hasStep) {
    return input.taskPlan;
  }
  const plan =
    input.taskPlan.frames.length === 0
      ? wrapSnapshotWithPlanStack(input.taskPlan)
      : input.taskPlan;
  return advancePlanAfterStepComplete(plan, input.completedNodeId).updatedPlan;
}

export function ensureWorkflowNodeStarted(
  run: WorkflowRunState,
  nodeId: string,
  now?: string,
): WorkflowRunState {
  const node = run.nodes.find((row) => row.nodeId === nodeId);
  if (!node || node.status !== 'pending') {
    return run;
  }
  return startWorkflowNode(run, nodeId, now);
}

export function mirrorWorkflowRunAfterPlanAdvance(input: {
  workflowRun: WorkflowRunState;
  planBefore: TaskPlanSnapshot;
  planAdvance: TaskPlanAdvanceResult;
}): WorkflowRunState {
  return syncWorkflowRunAfterPlanAdvance({
    workflowRun: input.workflowRun,
    planBefore: input.planBefore,
    planAdvance: input.planAdvance,
  });
}

export function completeWorkflowNodeFromSummarize(
  run: WorkflowRunState,
  nodeId: string,
  outputRef?: string,
  now?: string,
): WorkflowRunState {
  const node = run.nodes.find((row) => row.nodeId === nodeId);
  if (!node || node.status === 'succeeded' || node.status === 'skipped') {
    return run;
  }
  return completeWorkflowNode(run, nodeId, outputRef ?? `obs:summarize:${nodeId}`, now);
}
