import type {
  AgentRunStep,
  GraphToolCall,
  ToolObservation,
} from '../main/agent-engine.types';
import { nextRunStepNumber } from '../main/agent-run-steps.util';
import type { TaskPlanSnapshot } from '../main/task-plan.types';
import {
  countConsecutiveLlmRoundsWithoutToolCalls,
  getPendingPlanToolStep,
  isPlanToolStepSatisfiedByObservations,
  isPlanWriteToolStep,
  PLAN_TOOL_STEP_MAX_SKIPS_WITHOUT_CALLS,
  type PlanScopedTool,
  toolCallMatchesPendingPlanToolRole,
} from '../main/task-plan.util';
import {
  findIncompletePagedGatherTarget,
  resolvePagedGatherResumeKind,
  resolvePagedGatherResumeRoute,
  type PagedGatherResumeKind,
} from '../gather/paged-list-gather.util';
import {
  selectObservationsForPagedGatherResume,
  selectObservationsForPlanToolSatisfaction,
  type PlanObservationBuckets,
} from '../main/plan-observation-scope.util';
import {
  areToolCallRoundsIdentical,
  getLastToolRoundFromSteps,
  partitionToolCallsByHistory,
  type ToolCallLike,
} from './tool-call-dedupe.util';
import {
  buildSameArgsRepeatUserHint,
  findLastRecoverableToolErrorObservation,
  pendingCallsRepeatRecoverableToolError,
} from './tool-plan-error.util';
import {
  findLastErrorObservation,
  pickSummarizeErrorObservation,
  shouldReturnToLlmAfterToolErrors,
  shouldShortCircuitEmptyToSummarize,
  type ToolErrorDisposition,
  type ToolExecutionStatus,
} from './tool-execution-status.util';

export type ResultCheckPhase = 'pre_tools' | 'post_tools';

export type ResultCheckRoute = 'tools' | 'llm' | 'summarize' | 'expand_tools';

export type ResultCheckOutcome = {
  phase: ResultCheckPhase;
  route: ResultCheckRoute;
  reason: string;
  pendingToolCalls: GraphToolCall[];
  duplicateSkipCalls: GraphToolCall[];
  /** 因分页续拉优先而被搁置的 LLM tool_calls 数量（仅 telemetry）。 */
  supersededPendingToolCallCount?: number;
  /** 分页续拉类型：补 HTTP 页 vs 仅重试页内摘要。 */
  pagedGatherResumeKind?: PagedGatherResumeKind;
};

export type ToolRoundMeta = {
  toolCalls: GraphToolCall[];
  executionStatuses: ToolExecutionStatus[];
  errorDispositions: ToolErrorDisposition[];
  /** 与 toolCalls 同序，指向 toolObservations 中本轮各次调用的下标。 */
  roundObservationIndices: number[];
};

export function inferResultCheckPhase(state: {
  pendingToolCalls: GraphToolCall[];
  lastToolRoundMeta?: ToolRoundMeta | null;
}): ResultCheckPhase {
  if (state.pendingToolCalls.length > 0) {
    return 'pre_tools';
  }
  if (state.lastToolRoundMeta) {
    return 'post_tools';
  }
  return 'pre_tools';
}

function deferDuplicateSummarizeForPlan(input: {
  outcome: ResultCheckOutcome;
  taskPlan?: TaskPlanSnapshot | null;
  scopedTools?: PlanScopedTool[];
}): ResultCheckOutcome {
  if (
    input.outcome.route !== 'summarize' ||
    (input.outcome.reason !== 'duplicate_tool_call_round' &&
      input.outcome.reason !== 'all_tool_calls_duplicate') ||
    !input.taskPlan ||
    !input.scopedTools?.length
  ) {
    return input.outcome;
  }
  const step = getPendingPlanToolStep(input.taskPlan);
  if (!step || step.kind !== 'tool' || !step.toolRole) {
    return input.outcome;
  }
  const callsToCheck =
    input.outcome.duplicateSkipCalls.length > 0
      ? input.outcome.duplicateSkipCalls
      : input.outcome.pendingToolCalls;
  if (callsToCheck.length === 0) {
    return input.outcome;
  }
  const hasOffPlanCall = callsToCheck.some(
    (call) =>
      !toolCallMatchesPendingPlanToolRole(
        call,
        input.taskPlan!,
        input.scopedTools!,
      ),
  );
  if (!hasOffPlanCall) {
    return input.outcome;
  }
  return {
    ...input.outcome,
    route: 'llm',
    reason: 'duplicate_off_plan_step',
    pendingToolCalls: [],
  };
}

function resolvePlanToolStepPreToolsOutcome(input: {
  steps: AgentRunStep[];
  taskPlan?: TaskPlanSnapshot | null;
  observations: ToolObservation[];
  scopedTools?: PlanScopedTool[];
  skillConfig?: unknown;
}): ResultCheckOutcome | null {
  const pendingToolStep = getPendingPlanToolStep(input.taskPlan);
  if (
    !pendingToolStep ||
    pendingToolStep.kind !== 'tool' ||
    isPlanToolStepSatisfiedByObservations({
      step: pendingToolStep,
      observations: input.observations,
      scopedTools: input.scopedTools,
      taskPlan: input.taskPlan,
      skillConfig: input.skillConfig,
      purpose: 'pre_tools_advance',
    })
  ) {
    return null;
  }
  const base: Pick<ResultCheckOutcome, 'phase' | 'duplicateSkipCalls'> = {
    phase: 'pre_tools',
    duplicateSkipCalls: [],
  };
  const skipCount = countConsecutiveLlmRoundsWithoutToolCalls(input.steps);
  const writeStep = isPlanWriteToolStep(pendingToolStep);
  if (skipCount >= PLAN_TOOL_STEP_MAX_SKIPS_WITHOUT_CALLS) {
    if (writeStep) {
      return {
        ...base,
        route: 'summarize',
        reason: 'plan_write_step_exhausted',
        pendingToolCalls: [],
      };
    }
    return {
      ...base,
      route: 'summarize',
      reason: 'plan_tool_step_exhausted',
      pendingToolCalls: [],
    };
  }
  return {
    ...base,
    route: 'llm',
    reason: writeStep ? 'plan_write_step_required' : 'plan_tool_step_required',
    pendingToolCalls: [],
  };
}

/** LLM 产出 tool_calls 后：去重、决定是否还需要打 HTTP。 */
export function resolvePreToolsResultCheck(input: {
  pendingToolCalls: GraphToolCall[];
  steps: AgentRunStep[];
  taskPlan?: TaskPlanSnapshot | null;
  scopedTools?: PlanScopedTool[];
  observationBuckets: PlanObservationBuckets;
  skillConfig?: unknown;
}): ResultCheckOutcome {
  const base: Pick<ResultCheckOutcome, 'phase' | 'duplicateSkipCalls'> = {
    phase: 'pre_tools',
    duplicateSkipCalls: [],
  };
  const pagedObservations = selectObservationsForPagedGatherResume(
    input.observationBuckets,
  );
  const satisfactionObservations = selectObservationsForPlanToolSatisfaction(
    input.observationBuckets,
  );
  const pagedResumeRoute = resolvePagedGatherResumeRoute({
    pendingToolCalls: input.pendingToolCalls,
    taskPlan: input.taskPlan,
    scopedTools: input.scopedTools ?? [],
    observations: pagedObservations,
  });
  if (pagedResumeRoute) {
    return {
      ...base,
      route: 'tools',
      reason: 'paged_gather_resume',
      pendingToolCalls: [],
      supersededPendingToolCallCount: pagedResumeRoute.supersededPendingToolCallCount,
      pagedGatherResumeKind:
        resolvePagedGatherResumeKind({
          taskPlan: input.taskPlan,
          scopedTools: input.scopedTools ?? [],
          observations: pagedObservations,
        }) ?? undefined,
    };
  }
  const sameArgsRepeat = pendingCallsRepeatRecoverableToolError({
    pendingToolCalls: input.pendingToolCalls,
    observations: pagedObservations,
  });
  if (sameArgsRepeat.repeat && input.taskPlan) {
    return {
      ...base,
      route: 'summarize',
      reason: 'tool_error_same_args_repeat',
      pendingToolCalls: [],
    };
  }

  if (input.pendingToolCalls.length === 0) {
    const planOutcome = resolvePlanToolStepPreToolsOutcome({
      steps: input.steps,
      taskPlan: input.taskPlan,
      observations: satisfactionObservations,
      scopedTools: input.scopedTools,
      skillConfig: input.skillConfig,
    });
    if (planOutcome) {
      return planOutcome;
    }
    return {
      ...base,
      route: 'llm',
      reason: 'no_pending_tool_calls',
      pendingToolCalls: [],
    };
  }

  const lastRound = getLastToolRoundFromSteps(input.steps);
  if (areToolCallRoundsIdentical(input.pendingToolCalls, lastRound)) {
    return deferDuplicateSummarizeForPlan({
      outcome: {
        ...base,
        route: 'summarize',
        reason: 'duplicate_tool_call_round',
        pendingToolCalls: [],
        duplicateSkipCalls: input.pendingToolCalls,
      },
      taskPlan: input.taskPlan,
      scopedTools: input.scopedTools,
    });
  }

  const { novel, duplicates } = partitionToolCallsByHistory(
    input.pendingToolCalls,
    input.steps,
  );
  if (novel.length === 0) {
    return deferDuplicateSummarizeForPlan({
      outcome: {
        ...base,
        route: 'summarize',
        reason: 'all_tool_calls_duplicate',
        pendingToolCalls: [],
        duplicateSkipCalls: duplicates,
      },
      taskPlan: input.taskPlan,
      scopedTools: input.scopedTools,
    });
  }
  if (duplicates.length > 0) {
    return {
      ...base,
      route: 'tools',
      reason: 'partial_duplicate_filtered',
      pendingToolCalls: novel as GraphToolCall[],
      duplicateSkipCalls: duplicates as GraphToolCall[],
    };
  }

  return {
    ...base,
    route: 'tools',
    reason: 'execute_tools',
    pendingToolCalls: input.pendingToolCalls,
  };
}

/** tools 执行后：EMPTY / ERROR / expand / 回 LLM，纯规则不调 LLM。 */
export function resolvePostToolsResultCheck(input: {
  userMessage: string;
  observations: ToolObservation[];
  lastToolRoundMeta: ToolRoundMeta;
  scopedTools: Array<{
    name: string;
    agentMetadata: unknown;
    inputSchema: unknown;
    description?: string;
    responseProfile?: unknown;
  }>;
  taskPlan?: TaskPlanSnapshot | null;
  skillConfig?: unknown;
  skillApplied?: boolean;
  hasExpandedOnce: boolean;
  iteration: number;
  totalAllowedToolCount: number;
  isLowQualityLastObservation: boolean;
  /** 写确认续跑：用户已确认，写失败则直接 summarize，不再回 LLM 重试 */
  writeConfirmResume?: boolean;
}): ResultCheckOutcome {
  const base: Pick<ResultCheckOutcome, 'phase' | 'duplicateSkipCalls'> = {
    phase: 'post_tools',
    duplicateSkipCalls: [],
  };
  const {
    executionStatuses,
    errorDispositions,
    toolCalls,
    roundObservationIndices,
  } = input.lastToolRoundMeta;

  const shouldExpandOnce =
    !input.skillApplied &&
    !input.hasExpandedOnce &&
    input.iteration <= 1 &&
    input.scopedTools.length < input.totalAllowedToolCount &&
    toolCalls.length === 1 &&
    !executionStatuses.includes('ERROR') &&
    input.isLowQualityLastObservation;

  if (shouldExpandOnce) {
    return {
      ...base,
      route: 'expand_tools',
      reason: 'low_quality_first_result_expand_once',
      pendingToolCalls: [],
    };
  }

  if (input.writeConfirmResume && executionStatuses.length > 0) {
    return {
      ...base,
      route: 'summarize',
      reason: executionStatuses.includes('ERROR')
        ? 'tool_error_summarize'
        : 'write_confirm_resume_success',
      pendingToolCalls: [],
    };
  }

  if (
    shouldShortCircuitEmptyToSummarize({
      userMessage: input.userMessage,
      toolCalls,
      scopedTools: input.scopedTools,
      executionStatuses,
    })
  ) {
    return {
      ...base,
      route: 'summarize',
      reason: 'empty_tool_results',
      pendingToolCalls: [],
    };
  }

  if (
    pickSummarizeErrorObservation(
      input.observations,
      errorDispositions,
      roundObservationIndices,
    ) != null
  ) {
    return {
      ...base,
      route: 'summarize',
      reason: 'tool_error_summarize',
      pendingToolCalls: [],
    };
  }

  if (
    shouldReturnToLlmAfterToolErrors(
      input.observations,
      errorDispositions,
      roundObservationIndices,
    )
  ) {
    return {
      ...base,
      route: 'llm',
      reason: 'tool_error_recoverable',
      pendingToolCalls: [],
    };
  }

  const incompletePagedGather = findIncompletePagedGatherTarget({
    taskPlan: input.taskPlan,
    scopedTools: input.scopedTools as PlanScopedTool[],
    observations: input.observations,
  });
  if (incompletePagedGather) {
    return {
      ...base,
      route: 'tools',
      reason: 'paged_gather_resume',
      pendingToolCalls: [],
      pagedGatherResumeKind:
        resolvePagedGatherResumeKind({
          taskPlan: input.taskPlan,
          scopedTools: input.scopedTools as PlanScopedTool[],
          observations: input.observations,
        }) ?? undefined,
    };
  }

  return {
    ...base,
    route: 'llm',
    reason: 'continue_decision_loop',
    pendingToolCalls: [],
  };
}

/** resultCheck summarize 路由：合并成功观测，fallback 到本轮/最近 error。 */
export function resolveSummaryObservationForCheck(input: {
  reason: string;
  observations: ToolObservation[];
  savedRoundMeta?: ToolRoundMeta | null;
  mergedObservation: ToolObservation | null;
}): ToolObservation | null {
  const roundIndices = input.savedRoundMeta?.roundObservationIndices;
  const roundDispositions = input.savedRoundMeta?.errorDispositions;

  if (input.reason === 'tool_error_same_args_repeat') {
    const failed = findLastRecoverableToolErrorObservation(input.observations);
    if (!failed) {
      return null;
    }
    return {
      name: failed.name,
      output: {
        ...failed.output,
        userHint: buildSameArgsRepeatUserHint(failed.output),
      },
    };
  }

  if (input.reason === 'tool_error_summarize' && input.savedRoundMeta) {
    const errorObservation = pickSummarizeErrorObservation(
      input.observations,
      roundDispositions ?? [],
      roundIndices ?? [],
    );
    if (errorObservation) {
      return errorObservation;
    }
  }

  if (input.mergedObservation) {
    return input.mergedObservation;
  }

  if (input.savedRoundMeta) {
    const errorObservation = pickSummarizeErrorObservation(
      input.observations,
      roundDispositions ?? [],
      roundIndices ?? [],
    );
    if (errorObservation) {
      return errorObservation;
    }
  }

  return findLastErrorObservation(input.observations, roundIndices);
}

export function buildDuplicateSkipToolSteps(
  calls: ToolCallLike[],
  existingSteps: AgentRunStep[],
  reason: string,
): AgentRunStep[] {
  const steps = [...existingSteps];
  const result: AgentRunStep[] = [];
  for (const call of calls) {
    const stepNum = nextRunStepNumber(steps);
    const row: AgentRunStep = {
      step: stepNum,
      type: 'tool',
      name: call.name,
      input: call.arguments,
      output: {
        skipped: true,
        reason,
      },
    };
    steps.push(row);
    result.push(row);
  }
  return result;
}
