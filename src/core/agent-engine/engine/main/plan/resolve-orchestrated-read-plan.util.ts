import type {
  ResolveOuterPlanInput,
  ResolveTaskPlanResult,
  TaskDeliverable,
  TaskPlanSnapshot,
} from './task-plan.types';
import type { PlanTurnAxes } from './plan-turn-context.util';
import {
  buildOrchestratedTemplatePlanResult,
  buildTaskPlan,
} from './task-plan.util';

function applyPlanTurnAxes(
  plan: TaskPlanSnapshot,
  axes: PlanTurnAxes,
): TaskPlanSnapshot {
  return {
    ...plan,
    goal: axes.goal,
    originalUserRequest: axes.originalUserRequest,
  };
}

/**
 * orchestrated_read 专用 Plan 解析：template → 规则 template，不走 outer plan LLM。
 * 避免即兴 step 与 execution 绑定脱节（通用读/analysis 路径）。
 */
export function resolveOrchestratedReadPlanResult(input: {
  planInput: ResolveOuterPlanInput;
  deliverable: TaskDeliverable;
  planAxes: PlanTurnAxes;
}): ResolveTaskPlanResult {
  const { planInput, deliverable, planAxes } = input;
  const template = buildOrchestratedTemplatePlanResult({
    userMessage: planAxes.turnMessage,
    scopedToolSummaries: planInput.scopedToolSummaries,
    deliverable,
  });
  if (template) {
    return {
      ...template,
      plan: applyPlanTurnAxes(template.plan, planAxes),
    };
  }

  const rulePlan = buildTaskPlan({
    userMessage: planAxes.turnMessage,
    scopedToolSummaries: planInput.scopedToolSummaries,
  });
  return {
    plan: applyPlanTurnAxes(rulePlan, planAxes),
    method: rulePlan.source,
    llmFallbackReason: 'orchestrated_read_rule_fallback',
  };
}
