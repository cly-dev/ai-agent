import type { GraphToolCall } from '../main/agent-engine.types';
import type { TaskPlanAdvanceResult, TaskPlanSnapshot } from '../main/task-plan.types';
import {
  getPendingPlanToolStep,
  toolCallMatchesPendingPlanToolRole,
  type PlanScopedTool,
} from '../main/task-plan.util';
import type { ResultCheckOutcome } from './tool-result-check.util';

export type ResultCheckRouteAuthority = 'plan' | 'react' | 'safety_abort';

export type ResultCheckPlanFallback =
  | {
      action: 'summarize';
      authority: 'plan';
      supersededPendingToolCallCount: number;
    }
  | {
      action: 'llm_continue';
      authority: 'plan';
      clearPendingToolCalls: boolean;
      reason: string;
    }
  | {
      action: 'skill_step';
      authority: 'plan';
    };

/**
 * L3：Plan 与 ReAct outcome 冲突时的兜底裁决（步已完成后的 advance 优先于滞后 tool_calls）。
 * 返回 null 表示完全交给 L2 outcome 路由。
 */
export function resolveResultCheckPlanFallback(input: {
  outcome: ResultCheckOutcome;
  planAdvance: TaskPlanAdvanceResult | null;
}): ResultCheckPlanFallback | null {
  const { outcome, planAdvance } = input;

  if (
    outcome.route === 'tools' &&
    outcome.reason === 'paged_gather_resume'
  ) {
    return null;
  }

  if (!planAdvance) {
    return null;
  }

  if (planAdvance.route === 'summarize') {
    const superseded =
      outcome.route === 'tools' ? outcome.pendingToolCalls.length : 0;
    return {
      action: 'summarize',
      authority: 'plan',
      supersededPendingToolCallCount: superseded,
    };
  }

  if (
    planAdvance.route === 'llm' &&
    planAdvance.reason === 'plan_advance_skill_step'
  ) {
    return { action: 'skill_step', authority: 'plan' };
  }

  if (planAdvance.route === 'llm' && outcome.route === 'summarize') {
    return {
      action: 'llm_continue',
      authority: 'plan',
      clearPendingToolCalls: true,
      reason: planAdvance.reason,
    };
  }

  return null;
}

/** skill 步兜底：仅保留与推进后 Plan 当前 tool 步 role 匹配的 calls。 */
export function resolveSkillStepPendingToolCalls(input: {
  pendingToolCalls: GraphToolCall[];
  taskPlan: TaskPlanSnapshot | null | undefined;
  scopedTools: PlanScopedTool[];
}): GraphToolCall[] {
  if (!input.taskPlan || input.pendingToolCalls.length === 0) {
    return [];
  }
  const pendingToolStep = getPendingPlanToolStep(input.taskPlan);
  if (!pendingToolStep) {
    return [];
  }
  return input.pendingToolCalls.filter((call) =>
    toolCallMatchesPendingPlanToolRole(
      call,
      input.taskPlan!,
      input.scopedTools,
    ),
  );
}
