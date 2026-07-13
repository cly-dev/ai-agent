import { observationNeedsPagedFetch } from '../../../mcp-utils/pagination';
import type { TaskPlanSnapshot } from '../main/plan/task-plan.types';
import {
  getPendingPlanToolStep,
  planGatherRequiresFullFetch,
  resolveScopedToolRoleForPlan,
  type PlanScopedTool,
} from '../main/plan/task-plan.util';

/** Objective for page-summary LLM: pending analyze/answer summarize step. */
export function resolvePagedGatherSummarizeObjective(
  taskPlan?: TaskPlanSnapshot | null,
): string | undefined {
  if (!taskPlan) {
    return undefined;
  }
  const pending = new Set(taskPlan.pendingStepIds);
  const summarizeStep = taskPlan.steps.find(
    (step) =>
      pending.has(step.id) &&
      step.kind === 'summarize' &&
      (step.phase === 'analyze' || step.phase === 'answer'),
  );
  return summarizeStep?.objective;
}

/** Pending gather is read-list and stopWhen requires full fetch. */
export function isReadListGatherToolStep(input: {
  taskPlan?: TaskPlanSnapshot | null;
  toolName: string;
  scopedTools: PlanScopedTool[];
}): boolean {
  if (!input.taskPlan) {
    return false;
  }
  const pendingStep = getPendingPlanToolStep(input.taskPlan);
  if (!planGatherRequiresFullFetch(pendingStep)) {
    return false;
  }
  if (pendingStep?.phase !== 'gather') {
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
 * Plan-driven gate: gather stopWhen=observation_fetch_complete + read-list + more pages.
 * Single-page datasets skip expand and advance on raw observation.
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

/** Gather step must finish paged fetch/summary before honoring new tool_calls. */
export function planAwaitingPagedGatherCompletion(
  taskPlan?: TaskPlanSnapshot | null,
): boolean {
  if (!taskPlan) {
    return false;
  }
  const pendingStep = getPendingPlanToolStep(taskPlan);
  return (
    pendingStep?.phase === 'gather' &&
    planGatherRequiresFullFetch(pendingStep)
  );
}
