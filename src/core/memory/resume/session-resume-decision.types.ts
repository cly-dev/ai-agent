import type { WorkflowRunState } from '../../workflow/workflow.types';
import type { StoredTaskPlan } from '../goa/session-goa.types';

/** Plan 层 goal 来源策略（由 Resume Gate 决定，Plan 只执行）。 */
export type PlanGoalStrategy = 'inherit_active_task' | 'use_turn_message';

export type TaskResumeFollowUpKind = 'resume' | 'replan_same_goal' | 'new_topic';

/**
 * Session Resume Gate 唯一出口：整包续作 / 同任务重规划 / 全新 / 放弃旧任务。
 */
export type SessionResumeDecision =
  | {
      action: 'resume';
      plan: StoredTaskPlan;
      followUpReason: string | null;
      resumedFromRunId: number | null;
      workflowRun?: WorkflowRunState | null;
      goalStrategy: 'inherit_active_task';
    }
  | {
      action: 'fresh_same_goal';
      followUpReason: string | null;
      goalStrategy: 'inherit_active_task';
    }
  | {
      action: 'fresh';
      goalStrategy: 'use_turn_message';
      followUpReason?: string | null;
    }
  | { action: 'abandon_and_fresh' };

export function defaultFreshResumeDecision(): SessionResumeDecision {
  return { action: 'fresh', goalStrategy: 'use_turn_message' };
}

export function goalStrategyFromResumeDecision(
  decision: SessionResumeDecision,
): PlanGoalStrategy {
  if (decision.action === 'abandon_and_fresh') {
    return 'use_turn_message';
  }
  if (
    decision.action === 'resume' ||
    decision.action === 'fresh_same_goal'
  ) {
    return 'inherit_active_task';
  }
  return decision.goalStrategy;
}

export function resumeDecisionKeepsActiveTask(
  decision: SessionResumeDecision,
): boolean {
  return (
    decision.action === 'resume' || decision.action === 'fresh_same_goal'
  );
}
