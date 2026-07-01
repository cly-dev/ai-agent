import type { AgentRunStep, ToolObservation } from '../types/agent-engine.types';
import {
  planObservationBucketsFromState,
  selectObservationsForPlanToolSatisfaction,
  type PlanObservationBuckets,
  type PlanRunContext,
} from './plan-observation-scope.util';
import type { TaskPlanAdvanceResult, TaskPlanSnapshot } from './task-plan.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../../../../workflow/workflow.types';
import {
  applyPlanAdvanceAsWorkflowProgress,
  isWorkflowBoundRun,
} from '../../../../workflow/workflow-plan-transition.util';
import type { OuterPlanSkillSelectMethod } from './outer-plan-skill-resolve.util';
import {
  resolveHostToolPlanRunStatus,
} from '../host-tool/host-tool-run-step.util';
import {
  type PlanScopedTool,
  resolveTaskPlanAdvanceWhenStepSatisfied,
} from './task-plan.util';

export type TaskPlanSyncResult = {
  taskPlan: TaskPlanSnapshot | null;
  planAdvance: TaskPlanAdvanceResult | null;
  workflowRun?: WorkflowRunState;
  workflowAwaitingReact?: boolean;
};

export type PlanSyncSite = 'llm' | 'result_check' | 'readiness';

export type SyncTaskPlanBeforeReActInput = {
  taskPlan: TaskPlanSnapshot | null | undefined;
  scopedTools?: PlanScopedTool[];
  skillConfig?: unknown;
  runOwnedObservations?: ToolObservation[];
  observationBuckets?: PlanObservationBuckets;
  pageContextEntityId?: string | null;
  workflowRun?: WorkflowRunState | null;
  workflowNodeDefs?: WorkflowNodeDef[] | null;
  workflowAwaitingReact?: boolean;
};

/**
 * L1：ReAct 决策前将 Plan 与观测对齐。
 * 当前 pending gather 步已被 runOwned + 页内物化 observation 满足时推进。
 */
export function syncTaskPlanBeforeReAct(
  input: SyncTaskPlanBeforeReActInput,
): TaskPlanSyncResult {
  if (!input.taskPlan) {
    return { taskPlan: null, planAdvance: null };
  }
  const observations = input.observationBuckets
    ? selectObservationsForPlanToolSatisfaction(input.observationBuckets)
    : (input.runOwnedObservations ?? []);
  const planAdvance = resolveTaskPlanAdvanceWhenStepSatisfied({
    plan: input.taskPlan,
    observations,
    scopedTools: input.scopedTools,
    skillConfig: input.skillConfig,
    purpose: 'pre_tools_advance',
    pageContextEntityId: input.pageContextEntityId,
  });
  if (!planAdvance) {
    return { taskPlan: input.taskPlan, planAdvance: null };
  }
  if (isWorkflowBoundRun(input.workflowRun)) {
    const progressed = applyPlanAdvanceAsWorkflowProgress({
      taskPlan: input.taskPlan,
      workflowRun: input.workflowRun,
      workflowNodeDefs: input.workflowNodeDefs,
      workflowAwaitingReact: input.workflowAwaitingReact,
      planBefore: input.taskPlan,
      planAdvance,
    });
    return {
      taskPlan: progressed.taskPlan ?? input.taskPlan,
      planAdvance,
      workflowRun: progressed.workflowRun,
      workflowAwaitingReact: progressed.workflowAwaitingReact,
    };
  }
  return {
    taskPlan: planAdvance.updatedPlan,
    planAdvance,
  };
}

export function buildPlanRunStepOutput(input: {
  taskPlan: TaskPlanSnapshot;
  method: string;
  llmFallbackReason?: string | null;
  droppedHostToolStepIds?: string[];
  prunedHostToolStepIds?: string[];
  availableHostToolCount: number;
  availableHostToolNames: string[];
  availableSkillIds: number[];
  requestedSkillId?: number | null;
  requestedSkillEnforced?: boolean;
  sessionWorkingMemoryIncluded?: boolean;
  /** skill 帧展开后相对外层 plan 的观测标记 */
  skillFrameExpanded?: boolean;
  outerFrameCount?: number;
  outerSkillSelectMethod?: OuterPlanSkillSelectMethod | null;
  autoSelectedSkillId?: number | null;
  turnRoute?: string | null;
  turnSkillSelect?: string | null;
  pageContextPlan?: string | null;
  pageContextApplies?: boolean;
  pageContextTaskKind?: string | null;
  pageContextDataSufficiency?: string | null;
}): Record<string, unknown> {
  const planHostStatus = resolveHostToolPlanRunStatus({
    availableHostToolCount: input.availableHostToolCount,
    taskPlan: input.taskPlan,
  });
  return {
    method: input.method,
    llmFallbackReason: input.llmFallbackReason ?? null,
    droppedHostToolStepIds: input.droppedHostToolStepIds ?? [],
    prunedHostToolStepIds: input.prunedHostToolStepIds ?? [],
    plannedHostToolStepIds: planHostStatus.plannedHostToolStepIds,
    hostToolRunStatus: planHostStatus.hostToolRunStatus,
    availableSkillIds: input.availableSkillIds,
    requestedSkillId: input.requestedSkillId ?? null,
    requestedSkillEnforced: input.requestedSkillEnforced ?? false,
    source: input.taskPlan.source,
    deliverable: input.taskPlan.deliverable,
    goal: input.taskPlan.goal,
    stepIds: input.taskPlan.steps.map((step) => step.id),
    pendingStepIds: input.taskPlan.pendingStepIds,
    currentStepId: input.taskPlan.currentStepId,
    currentObjective: input.taskPlan.currentObjective,
    taskPhase: input.taskPlan.taskPhase,
    activeFrameIndex: input.taskPlan.activeFrameIndex,
    frameCount: input.taskPlan.frames.length,
    skillFrameExpanded: input.skillFrameExpanded ?? false,
    outerFrameCount: input.outerFrameCount ?? input.taskPlan.frames.length,
    sessionWorkingMemoryIncluded: input.sessionWorkingMemoryIncluded ?? false,
    availableHostToolCount: input.availableHostToolCount,
    availableHostToolNames: input.availableHostToolNames,
    outerSkillSelectMethod: input.outerSkillSelectMethod ?? null,
    autoSelectedSkillId: input.autoSelectedSkillId ?? null,
    turnRoute: input.turnRoute ?? null,
    turnSkillSelect: input.turnSkillSelect ?? null,
    pageContextPlan: input.pageContextPlan ?? null,
    pageContextApplies: input.pageContextApplies ?? false,
    pageContextTaskKind: input.pageContextTaskKind ?? null,
    pageContextDataSufficiency: input.pageContextDataSufficiency ?? null,
  };
}

export function buildSkillFrameExpandedPlanSyncStep(input: {
  step: number;
  taskPlan: TaskPlanSnapshot;
  availableHostToolCount: number;
  availableHostToolNames: string[];
  frameCountBefore: number;
  planRunContext?: PlanRunContext;
}): AgentRunStep {
  const planHostStatus = resolveHostToolPlanRunStatus({
    availableHostToolCount: input.availableHostToolCount,
    taskPlan: input.taskPlan,
  });
  const planAdvance: TaskPlanAdvanceResult = {
    updatedPlan: input.taskPlan,
    route: 'llm',
    reason: 'skill_frame_expanded',
  };
  return {
    step: input.step,
    type: 'plan_sync',
    output: {
      site: 'readiness',
      reason: planAdvance.reason,
      route: planAdvance.route,
      fromStepId: null,
      toStepId: input.taskPlan.currentStepId ?? null,
      pendingStepIds: input.taskPlan.pendingStepIds,
      frameCountBefore: input.frameCountBefore,
      frameCountAfter: input.taskPlan.frames.length,
      plannedHostToolStepIds: planHostStatus.plannedHostToolStepIds,
      hostToolRunStatus: planHostStatus.hostToolRunStatus,
      deliverable: input.taskPlan.deliverable,
      stepIds: input.taskPlan.steps.map((step) => step.id),
      availableHostToolCount: input.availableHostToolCount,
      availableHostToolNames: input.availableHostToolNames,
      ...(input.planRunContext
        ? { planRunContext: input.planRunContext }
        : {}),
    },
  };
}

export function buildPlanSyncRunStep(input: {
  step: number;
  planAdvance: TaskPlanAdvanceResult;
  fromStepId: string | null;
  site: PlanSyncSite;
  planRunContext?: PlanRunContext;
}): AgentRunStep {
  return {
    step: input.step,
    type: 'plan_sync',
    output: {
      site: input.site,
      reason: input.planAdvance.reason,
      route: input.planAdvance.route,
      fromStepId: input.fromStepId,
      toStepId: input.planAdvance.updatedPlan.currentStepId ?? null,
      pendingStepIds: input.planAdvance.updatedPlan.pendingStepIds,
      ...(input.planRunContext
        ? { planRunContext: input.planRunContext }
        : {}),
    },
  };
}

export function toPlanSyncAgentStep(input: {
  step: number;
  planAdvance: TaskPlanAdvanceResult;
  fromStepId: string | null;
  site: PlanSyncSite;
  planRunContext?: PlanRunContext;
  normalizeOutput: (value: unknown) => Record<string, unknown> | string | undefined;
}): AgentRunStep {
  const base = buildPlanSyncRunStep({
    step: input.step,
    planAdvance: input.planAdvance,
    fromStepId: input.fromStepId,
    site: input.site,
    planRunContext: input.planRunContext,
  });
  const output = input.normalizeOutput(base.output);
  return {
    step: base.step,
    type: 'plan_sync',
    ...(output !== undefined ? { output } : {}),
  };
}

export { planObservationBucketsFromState };
