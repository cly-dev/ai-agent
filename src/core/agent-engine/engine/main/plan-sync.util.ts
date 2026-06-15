import type { AgentRunStep, ToolObservation } from './agent-engine.types';
import {
  planObservationBucketsFromState,
  type PlanRunContext,
} from './plan-observation-scope.util';
import type { TaskPlanAdvanceResult, TaskPlanSnapshot } from './task-plan.types';
import {
  type PlanScopedTool,
  resolveTaskPlanAdvanceWhenStepSatisfied,
} from './task-plan.util';

export type TaskPlanSyncResult = {
  taskPlan: TaskPlanSnapshot | null;
  planAdvance: TaskPlanAdvanceResult | null;
};

export type PlanSyncSite = 'llm' | 'result_check';

export type SyncTaskPlanBeforeReActInput = {
  taskPlan: TaskPlanSnapshot | null | undefined;
  scopedTools?: PlanScopedTool[];
  skillConfig?: unknown;
  runOwnedObservations: ToolObservation[];
};

/**
 * L1：ReAct 决策前将 Plan 与 **本 run** 观测对齐。
 * 当前 pending gather 步已被 runOwned 满足时推进，避免 LLM 在过期步上绑工具。
 */
export function syncTaskPlanBeforeReAct(
  input: SyncTaskPlanBeforeReActInput,
): TaskPlanSyncResult {
  if (!input.taskPlan) {
    return { taskPlan: null, planAdvance: null };
  }
  const planAdvance = resolveTaskPlanAdvanceWhenStepSatisfied({
    plan: input.taskPlan,
    observations: input.runOwnedObservations,
    scopedTools: input.scopedTools,
    skillConfig: input.skillConfig,
    purpose: 'pre_tools_advance',
  });
  return {
    taskPlan: planAdvance?.updatedPlan ?? input.taskPlan,
    planAdvance,
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
