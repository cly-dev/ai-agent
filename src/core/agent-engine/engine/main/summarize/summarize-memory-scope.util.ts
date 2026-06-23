import type { SplitToolObservationsInput } from '../../graph-tool-observations.util';
import type { SummarizeMemoryScopeMeta } from '../../observation-format.util';
import type { ToolObservation } from '../types/agent-engine.types';
import {
  completedGatherStepsSatisfiedInObservations,
  filterObservationsForPlanSummarize,
  isPendingPlanAnswerStep,
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
  | 'working_memory_only'
  | 'current_run_only'
  | 'both_buckets'
  | 'filter_miss'
  | 'empty';

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
  const answerStep = isPendingPlanAnswerStep(plan);
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
  });
  const cr = filterObservationsForPlanSummarize({
    plan,
    observations: input.split.currentRun,
    scopedTools: input.scopedTools,
    strict: true,
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

/**
 * 规则版 reflect_memory：在 summarize 前确定「本轮答案只认哪一份 obs」。
 */
export function resolveSummarizeMemoryScope(
  input: ResolveSummarizeMemoryScopeInput,
): SummarizeMemoryScope {
  const plan = input.plan ?? null;
  const filtered = planFilteredSplit(input);
  const workingMemory = filtered.workingMemory;
  const currentRun = filtered.currentRun;

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

  // follow-up analyze/reason：本轮无工具 → 只认 working_memory
  if (currentRun.length === 0 && plan && isPendingPlanAnswerStep(plan)) {
    if (workingMemory.length > 0) {
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
  if (currentRun.length > 0 && (!plan || !isPendingPlanAnswerStep(plan))) {
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

  // 两边都有：plan answer 步优先 working_memory（续分析），否则 current_run
  if (plan && isPendingPlanAnswerStep(plan)) {
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
