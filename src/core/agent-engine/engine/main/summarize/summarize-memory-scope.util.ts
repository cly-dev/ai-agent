import type { WorkflowNodeDef, WorkflowRunState } from '../../../../workflow/workflow.types';
import type { SplitToolObservationsInput } from '../../graph-tool-observations.util';
import type { SummarizeMemoryScopeMeta } from '../../observation-format.util';
import type { ToolObservation } from '../types/agent-engine.types';
import {
  allowsWorkingMemoryForPlanAnswer,
  type PlanRunContext,
} from '../plan/plan-observation-scope.util';
import { planSummarizeRequiresToolEvidence } from '../plan/plan-summarize-gate.util';
import {
  completedGatherStepsSatisfiedInObservations,
  filterObservationsForPlanSummarize,
  isPendingPlanAnswerStep,
  planHasChitchatConstraint,
  type PlanScopedTool,
} from '../plan/task-plan.util';
import type { TaskPlanSnapshot } from '../plan/task-plan.types';

export type SummarizeMemoryPrimarySource =
  | 'current_run'
  | 'working_memory'
  | 'both'
  | 'none';

export type SummarizeMemoryScopeReason =
  | 'current_run_gather_complete'
  | 'follow_up_working_memory'
  | 'fresh_topic_current_run_only'
  | 'replan_requires_fresh_gather'
  | 'working_memory_only'
  | 'current_run_only'
  | 'both_buckets'
  | 'filter_miss'
  | 'empty'
  | 'chitchat_no_tool_memory';

export type SummarizeMemoryScope = {
  primarySource: SummarizeMemoryPrimarySource;
  workingMemory: ToolObservation[];
  currentRun: ToolObservation[];
  reason: SummarizeMemoryScopeReason;
  filterMiss?: boolean;
};

export type ResolveSummarizeMemoryScopeInput = {
  split: SplitToolObservationsInput;
  plan?: TaskPlanSnapshot | null;
  scopedTools?: PlanScopedTool[];
  workflowRun?: WorkflowRunState | null;
  workflowNodeDefs?: WorkflowNodeDef[] | null;
  planRunContext?: PlanRunContext;
};

type PlanFilteredSplit = {
  workingMemory: ToolObservation[];
  currentRun: ToolObservation[];
  workingMemoryFilterMiss: boolean;
  currentRunFilterMiss: boolean;
};

function toScopeMeta(scope: SummarizeMemoryScope): SummarizeMemoryScopeMeta {
  return {
    primarySource: scope.primarySource,
    reason: scope.reason,
    filterMiss: scope.filterMiss,
    workingMemoryCount: scope.workingMemory.length,
    currentRunCount: scope.currentRun.length,
  };
}

/**
 * Plan 严格过滤仅在 summarize/reason 步启用，避免 gather 阶段误裁 current_run。
 */
function planFilteredSplit(
  input: ResolveSummarizeMemoryScopeInput,
): PlanFilteredSplit {
  const plan = input.plan;
  if (!plan) {
    return {
      workingMemory: input.split.workingMemory,
      currentRun: input.split.currentRun,
      workingMemoryFilterMiss: false,
      currentRunFilterMiss: false,
    };
  }
  const answerStep = isPendingPlanAnswerStep(
    plan,
    input.workflowRun,
    input.workflowNodeDefs,
  );
  if (!answerStep) {
    return {
      workingMemory: input.split.workingMemory,
      currentRun: input.split.currentRun,
      workingMemoryFilterMiss: false,
      currentRunFilterMiss: false,
    };
  }
  const wm = filterObservationsForPlanSummarize({
    plan,
    observations: input.split.workingMemory,
    scopedTools: input.scopedTools,
    strict: true,
    workflowRun: input.workflowRun,
  });
  const cr = filterObservationsForPlanSummarize({
    plan,
    observations: input.split.currentRun,
    scopedTools: input.scopedTools,
    strict: true,
    workflowRun: input.workflowRun,
  });
  return {
    workingMemory: wm.observations,
    currentRun: cr.observations,
    workingMemoryFilterMiss: wm.filterMiss,
    currentRunFilterMiss: cr.filterMiss,
  };
}

function scopeResult(
  scope: Omit<SummarizeMemoryScope, 'filterMiss'> & { filterMiss?: boolean },
): SummarizeMemoryScope {
  return {
    ...scope,
    filterMiss: scope.filterMiss === true ? true : undefined,
  };
}

function shouldBlockStaleSessionWorkingMemory(input: {
  plan: TaskPlanSnapshot | null;
  planRunContext: PlanRunContext;
}): boolean {
  return (
    input.plan != null &&
    planSummarizeRequiresToolEvidence(input.plan) &&
    !allowsWorkingMemoryForPlanAnswer(input.planRunContext)
  );
}

function withSelectedFilterMiss(
  scope: Omit<SummarizeMemoryScope, 'filterMiss'>,
  filterMiss: boolean,
): SummarizeMemoryScope {
  return scopeResult({
    ...scope,
    filterMiss,
    reason: filterMiss ? 'filter_miss' : scope.reason,
  });
}

function staleSessionWorkingMemoryScope(): SummarizeMemoryScope {
  return scopeResult({
    primarySource: 'none',
    workingMemory: [],
    currentRun: [],
    reason: 'replan_requires_fresh_gather',
    filterMiss: true,
  });
}

/**
 * 规则版 reflect_memory：在 summarize 前确定「本轮答案只认哪一份 obs」。
 */
export function resolveSummarizeMemoryScope(
  input: ResolveSummarizeMemoryScopeInput,
): SummarizeMemoryScope {
  const plan = input.plan ?? null;
  const planRunContext = input.planRunContext ?? 'fresh';
  const filtered = planFilteredSplit(input);
  const workingMemory = filtered.workingMemory;
  const currentRun = filtered.currentRun;

  // direct_answer / chitchat：不注入 session tool obs，避免续作分析规则污染闲聊
  if (planHasChitchatConstraint(plan)) {
    return scopeResult({
      primarySource: 'none',
      workingMemory: [],
      currentRun: [],
      reason: 'chitchat_no_tool_memory',
    });
  }

  if (workingMemory.length === 0 && currentRun.length === 0) {
    const filterMiss =
      filtered.workingMemoryFilterMiss || filtered.currentRunFilterMiss;
    return scopeResult({
      primarySource: 'none',
      workingMemory: [],
      currentRun: [],
      reason: filterMiss ? 'filter_miss' : 'empty',
      filterMiss,
    });
  }

  // 本轮 gather 已完成且 current_run 有满足 stopWhen 的观测 → 只认 current_run
  if (
    plan &&
    currentRun.length > 0 &&
    completedGatherStepsSatisfiedInObservations({
      plan,
      observations: currentRun,
      scopedTools: input.scopedTools,
    })
  ) {
    return withSelectedFilterMiss(
      {
        primarySource: 'current_run',
        workingMemory: [],
        currentRun,
        reason: 'current_run_gather_complete',
      },
      filtered.currentRunFilterMiss,
    );
  }

  // follow-up analyze/reason：仅 resume 续作可用 working_memory；replan 必须重新 gather
  if (
    currentRun.length === 0 &&
    plan &&
    isPendingPlanAnswerStep(plan, input.workflowRun, input.workflowNodeDefs)
  ) {
    if (workingMemory.length > 0) {
      if (shouldBlockStaleSessionWorkingMemory({ plan, planRunContext })) {
        return staleSessionWorkingMemoryScope();
      }
      return withSelectedFilterMiss(
        {
          primarySource: 'working_memory',
          workingMemory,
          currentRun: [],
          reason: 'follow_up_working_memory',
        },
        filtered.workingMemoryFilterMiss,
      );
    }
    return scopeResult({
      primarySource: 'none',
      workingMemory: [],
      currentRun: [],
      reason: 'filter_miss',
      filterMiss: true,
    });
  }

  // 新话题 / 本轮刚拉数：有 current_run 且非 plan answer 步 → 丢弃 session 噪音
  if (currentRun.length > 0 && (!plan || !isPendingPlanAnswerStep(plan, input.workflowRun, input.workflowNodeDefs))) {
    return scopeResult({
      primarySource: 'current_run',
      workingMemory: [],
      currentRun,
      reason: 'fresh_topic_current_run_only',
    });
  }

  if (currentRun.length > 0 && workingMemory.length === 0) {
    return withSelectedFilterMiss(
      {
        primarySource: 'current_run',
        workingMemory: [],
        currentRun,
        reason: 'current_run_only',
      },
      filtered.currentRunFilterMiss,
    );
  }

  if (workingMemory.length > 0 && currentRun.length === 0) {
    if (shouldBlockStaleSessionWorkingMemory({ plan, planRunContext })) {
      return staleSessionWorkingMemoryScope();
    }
    return withSelectedFilterMiss(
      {
        primarySource: 'working_memory',
        workingMemory,
        currentRun: [],
        reason: 'working_memory_only',
      },
      filtered.workingMemoryFilterMiss,
    );
  }

  // 两边都有：plan answer 步优先 working_memory（仅 resume），否则 current_run
  if (plan && isPendingPlanAnswerStep(plan, input.workflowRun, input.workflowNodeDefs)) {
    if (
      completedGatherStepsSatisfiedInObservations({
        plan,
        observations: currentRun,
        scopedTools: input.scopedTools,
      })
    ) {
      return withSelectedFilterMiss(
        {
          primarySource: 'current_run',
          workingMemory: [],
          currentRun,
          reason: 'current_run_gather_complete',
        },
        filtered.currentRunFilterMiss,
      );
    }
    if (allowsWorkingMemoryForPlanAnswer(planRunContext) && workingMemory.length > 0) {
      return withSelectedFilterMiss(
        {
          primarySource: 'working_memory',
          workingMemory,
          currentRun: [],
          reason: 'follow_up_working_memory',
        },
        filtered.workingMemoryFilterMiss,
      );
    }
    if (planSummarizeRequiresToolEvidence(plan)) {
      return scopeResult({
        primarySource: 'none',
        workingMemory: [],
        currentRun: [],
        reason: 'replan_requires_fresh_gather',
        filterMiss: true,
      });
    }
  }

  return scopeResult({
    primarySource: 'current_run',
    workingMemory: [],
    currentRun,
    reason: 'fresh_topic_current_run_only',
  });
}

export function applySummarizeMemoryScope(
  split: SplitToolObservationsInput,
  scope: SummarizeMemoryScope,
): SplitToolObservationsInput & { memoryScope: SummarizeMemoryScopeMeta } {
  return {
    workingMemory: scope.workingMemory,
    currentRun: scope.currentRun,
    memoryScope: toScopeMeta(scope),
  };
}
