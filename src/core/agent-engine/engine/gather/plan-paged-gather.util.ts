import { observationNeedsPagedFetch } from '../../../mcp-utils/pagination';
import type { TaskPlanSnapshot } from '../main/plan/task-plan.types';
import {
  getPendingPlanToolStep,
  resolveScopedToolRoleForPlan,
  type PlanScopedTool,
} from '../main/plan/task-plan.util';

/** Plan still has an analyze step ahead of the current gather. */
export function planHasPendingAnalyzeStep(
  taskPlan?: TaskPlanSnapshot | null,
): boolean {
  if (!taskPlan) {
    return false;
  }
  const pending = new Set(taskPlan.pendingStepIds);
  return taskPlan.steps.some(
    (step) => pending.has(step.id) && step.phase === 'analyze',
  );
}

/** Objective for page-summary LLM: prefer the pending analyze step. */
export function resolvePagedGatherAnalyzeObjective(
  taskPlan?: TaskPlanSnapshot | null,
): string | undefined {
  if (!taskPlan) {
    return undefined;
  }
  const pending = new Set(taskPlan.pendingStepIds);
  const analyzeStep = taskPlan.steps.find(
    (step) => pending.has(step.id) && step.phase === 'analyze',
  );
  return analyzeStep?.objective;
}

/** Current plan step is gather + read-list tool. */
export function isReadListGatherToolStep(input: {
  taskPlan?: TaskPlanSnapshot | null;
  toolName: string;
  scopedTools: PlanScopedTool[];
}): boolean {
  if (!planHasPendingAnalyzeStep(input.taskPlan) || !input.taskPlan) {
    return false;
  }
  const pendingStep = getPendingPlanToolStep(input.taskPlan);
  if (pendingStep?.phase !== 'gather' || pendingStep.kind !== 'tool') {
    return false;
  }
  if (pendingStep.toolRole && pendingStep.toolRole !== 'read-list') {
    return false;
  }
  const tool = input.scopedTools.find((row) => row.name === input.toolName);
  if (!tool) {
    return false;
  }
  const toolRole = resolveScopedToolRoleForPlan(tool);
  if (toolRole !== 'read-list') {
    return false;
  }
  if (pendingStep.toolRole && pendingStep.toolRole !== toolRole) {
    return false;
  }
  return true;
}

/**
 * Plan-driven gate: analyze ahead + gather read-list + observation needs more pages.
 * Small single-page datasets skip expand and advance the plan on raw observation.
 */
export function shouldExpandPlanPagedGather(input: {
  taskPlan?: TaskPlanSnapshot | null;
  toolName: string;
  scopedTools: PlanScopedTool[];
  output: unknown;
  args?: Record<string, unknown>;
  llmPayload?: { summary?: Record<string, unknown> };
}): boolean {
  if (
    !isReadListGatherToolStep({
      taskPlan: input.taskPlan,
      toolName: input.toolName,
      scopedTools: input.scopedTools,
    })
  ) {
    return false;
  }
  return observationNeedsPagedFetch({
    output: input.output,
    args: input.args,
    llmPayload: input.llmPayload,
  });
}

/** Gather step should finish paged fetch/summary before honoring new tool_calls. */
export function planAwaitingPagedGatherCompletion(
  taskPlan?: TaskPlanSnapshot | null,
): boolean {
  if (!planHasPendingAnalyzeStep(taskPlan) || !taskPlan) {
    return false;
  }
  const pendingStep = getPendingPlanToolStep(taskPlan);
  return pendingStep?.phase === 'gather' && pendingStep.kind === 'tool';
}
