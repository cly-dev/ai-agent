import type { WorkflowNodeDef, WorkflowRunState } from '../../../../workflow/workflow.types';
import { workflowNodeRequiresReactLoop } from '../../../../workflow/workflow-plan-sync.util';
import { startWorkflowNode } from '../../../../workflow/workflow-run.util';
import type { PlanObservationBuckets } from './plan-observation-scope.util';
import {
  selectObservationsForPlanToolSatisfaction,
} from './plan-observation-scope.util';
import {
  syncPlanFromActiveFrame,
  updateActivePlanFrame,
  wrapSnapshotWithPlanStack,
} from './plan-stack.util';
import {
  filterObservationsForPlanSummarize,
  getPendingPlanToolStep,
  isPendingPlanAnswerStep,
  isPlanToolStepSatisfiedByObservations,
  planHasChitchatConstraint,
  type PlanScopedTool,
} from './task-plan.util';
import type { TaskPlanSnapshot, TaskPlanStep } from './task-plan.types';
import type { ToolObservation } from '../types/agent-engine.types';

export type PlanSummarizeGateStatus =
  | 'not_answer_step'
  | 'allowed'
  | 'rewind_gather';

export type PlanSummarizeGateResult =
  | { status: 'not_answer_step' }
  | { status: 'allowed'; reason: 'no_gather_required' | 'gather_evidence_present' }
  | {
      status: 'rewind_gather';
      reason: 'gather_unsatisfied';
      rewindPlan: TaskPlanSnapshot;
      gatherStepId: string;
    };

/** 需要真实 tool 证据才能 summarize（排除 chitchat / page inline）。 */
export function planSummarizeRequiresToolEvidence(
  plan: TaskPlanSnapshot | null | undefined,
): boolean {
  if (!plan || planHasChitchatConstraint(plan)) {
    return false;
  }
  if (plan.constraints.includes('page_context_inline')) {
    return false;
  }
  return plan.steps.some(
    (step) => step.kind === 'tool' && step.phase === 'gather' && step.toolRole,
  );
}

export function firstUnsatisfiedGatherToolStep(input: {
  plan: TaskPlanSnapshot;
  observations: ToolObservation[];
  scopedTools?: PlanScopedTool[];
}): TaskPlanStep | null {
  for (const step of input.plan.steps) {
    if (step.kind !== 'tool' || step.phase !== 'gather' || !step.toolRole) {
      continue;
    }
    if (
      !isPlanToolStepSatisfiedByObservations({
        step,
        observations: input.observations,
        scopedTools: input.scopedTools,
        taskPlan: input.plan,
        purpose: 'observation_bucket',
      })
    ) {
      return step;
    }
  }
  return null;
}

export function rewindPlanToGatherStep(
  plan: TaskPlanSnapshot,
  gatherStepId: string,
): TaskPlanSnapshot {
  const normalized =
    plan.frames.length === 0 ? wrapSnapshotWithPlanStack(plan) : plan;
  const gatherIndex = normalized.steps.findIndex((step) => step.id === gatherStepId);
  if (gatherIndex < 0) {
    return plan;
  }
  const pendingStepIds = normalized.steps.slice(gatherIndex).map((step) => step.id);
  const completedStepIds = normalized.steps.slice(0, gatherIndex).map((step) => step.id);
  const current = normalized.steps[gatherIndex]!;
  return syncPlanFromActiveFrame(
    updateActivePlanFrame(normalized, (frame) => ({
      ...frame,
      pendingStepIds,
      completedStepIds,
      currentStepId: current.id,
      currentObjective: current.objective,
      taskPhase: current.phase,
    })),
  );
}

export function rewindWorkflowRunToPlanStep(input: {
  workflowRun: WorkflowRunState;
  plan: TaskPlanSnapshot;
  stepId: string;
  workflowNodeDefs?: WorkflowNodeDef[] | null;
}): { workflowRun: WorkflowRunState; workflowAwaitingReact: boolean } {
  const stepIndex = input.plan.steps.findIndex((step) => step.id === input.stepId);
  if (stepIndex < 0) {
    return { workflowRun: input.workflowRun, workflowAwaitingReact: false };
  }
  const rewindIds = new Set(
    input.plan.steps.slice(stepIndex).map((step) => step.id),
  );
  const resetRun: WorkflowRunState = {
    ...input.workflowRun,
    status: 'running',
    nodes: input.workflowRun.nodes.map((node) => {
      if (!rewindIds.has(node.nodeId)) {
        return node;
      }
      return {
        nodeId: node.nodeId,
        action: node.action,
        name: node.name,
        status: 'pending' as const,
      };
    }),
  };
  const workflowRun = startWorkflowNode(resetRun, input.stepId);
  const def = input.workflowNodeDefs?.find((row) => row.id === input.stepId);
  return {
    workflowRun,
    workflowAwaitingReact: workflowNodeRequiresReactLoop(def),
  };
}

/**
 * Plan summarize 准入 SSOT：有 gather 步时必须已有 tool 证据，否则回退到 gather。
 */
export function assessPlanSummarizeGate(input: {
  plan: TaskPlanSnapshot | null | undefined;
  observationBuckets: PlanObservationBuckets;
  scopedTools: PlanScopedTool[];
  workflowRun?: WorkflowRunState | null;
  workflowNodeDefs?: WorkflowNodeDef[] | null;
}): PlanSummarizeGateResult {
  const plan = input.plan;
  if (
    !plan ||
    !isPendingPlanAnswerStep(plan, input.workflowRun, input.workflowNodeDefs)
  ) {
    return { status: 'not_answer_step' };
  }

  if (!planSummarizeRequiresToolEvidence(plan)) {
    return { status: 'allowed', reason: 'no_gather_required' };
  }

  const summarizeObservations = [
    ...input.observationBuckets.preloaded,
    ...input.observationBuckets.runOwned,
  ];
  const strict = filterObservationsForPlanSummarize({
    plan,
    observations: summarizeObservations,
    scopedTools: input.scopedTools,
    strict: true,
    workflowRun: input.workflowRun,
  });
  if (strict.observations.length > 0 && !strict.filterMiss) {
    return { status: 'allowed', reason: 'gather_evidence_present' };
  }

  const satisfactionObservations = selectObservationsForPlanToolSatisfaction(
    input.observationBuckets,
  );
  const unsatisfied =
    firstUnsatisfiedGatherToolStep({
      plan,
      observations: satisfactionObservations,
      scopedTools: input.scopedTools,
    }) ??
    plan.steps.find(
      (step) => step.kind === 'tool' && step.phase === 'gather' && step.toolRole,
    );
  if (!unsatisfied) {
    return { status: 'allowed', reason: 'no_gather_required' };
  }

  return {
    status: 'rewind_gather',
    reason: 'gather_unsatisfied',
    rewindPlan: rewindPlanToGatherStep(plan, unsatisfied.id),
    gatherStepId: unsatisfied.id,
  };
}

export function applyPlanSummarizeRewind<
  T extends {
    taskPlan?: TaskPlanSnapshot | null;
    workflowRun?: WorkflowRunState | null;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
    workflowAwaitingReact?: boolean;
    pendingRespond?: unknown;
  },
>(state: T, gate: Extract<PlanSummarizeGateResult, { status: 'rewind_gather' }>): T {
  let next: T = {
    ...state,
    taskPlan: gate.rewindPlan,
    pendingRespond: null,
  };
  if (next.workflowRun) {
    const aligned = rewindWorkflowRunToPlanStep({
      workflowRun: next.workflowRun,
      plan: gate.rewindPlan,
      stepId: gate.gatherStepId,
      workflowNodeDefs: next.workflowNodeDefs,
    });
    next = {
      ...next,
      workflowRun: aligned.workflowRun,
      workflowAwaitingReact: aligned.workflowAwaitingReact,
    };
  }
  return next;
}

/**
 * gather 阶段 / 无 tool 证据时回退到 gather（不限于 answer 步；供澄清压制等路径复用）。
 */
export function resolvePlanGatherRewindWhenToolsMissing(input: {
  plan: TaskPlanSnapshot | null | undefined;
  observationBuckets: PlanObservationBuckets;
  scopedTools: PlanScopedTool[];
  workflowRun?: WorkflowRunState | null;
  workflowNodeDefs?: WorkflowNodeDef[] | null;
}): Extract<PlanSummarizeGateResult, { status: 'rewind_gather' }> | null {
  const plan = input.plan;
  if (!plan || !planSummarizeRequiresToolEvidence(plan)) {
    return null;
  }
  if (
    planSummarizeHasToolEvidence({
      plan,
      observationBuckets: input.observationBuckets,
      scopedTools: input.scopedTools,
      workflowRun: input.workflowRun,
    })
  ) {
    return null;
  }
  const satisfactionObservations = selectObservationsForPlanToolSatisfaction(
    input.observationBuckets,
  );
  const unsatisfied =
    firstUnsatisfiedGatherToolStep({
      plan,
      observations: satisfactionObservations,
      scopedTools: input.scopedTools,
    }) ??
    getPendingPlanToolStep(plan, input.workflowRun);
  if (
    !unsatisfied ||
    unsatisfied.kind !== 'tool' ||
    unsatisfied.phase !== 'gather'
  ) {
    return null;
  }
  return {
    status: 'rewind_gather',
    reason: 'gather_unsatisfied',
    rewindPlan: rewindPlanToGatherStep(plan, unsatisfied.id),
    gatherStepId: unsatisfied.id,
  };
}

export function planSummarizeHasToolEvidence(input: {
  plan: TaskPlanSnapshot | null | undefined;
  observationBuckets: PlanObservationBuckets;
  scopedTools?: PlanScopedTool[];
  workflowRun?: WorkflowRunState | null;
}): boolean {
  if (!planSummarizeRequiresToolEvidence(input.plan)) {
    return true;
  }
  const strict = filterObservationsForPlanSummarize({
    plan: input.plan!,
    observations: [
      ...input.observationBuckets.preloaded,
      ...input.observationBuckets.runOwned,
    ],
    scopedTools: input.scopedTools,
    strict: true,
    workflowRun: input.workflowRun,
  });
  return strict.observations.length > 0 && !strict.filterMiss;
}
