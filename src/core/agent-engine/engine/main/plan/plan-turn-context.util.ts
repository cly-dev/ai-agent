import type { PlanSessionWorkingMemory } from './task-plan.types';
import type { TurnExecutionContract } from '../../turn/turn-execution-contract.types';
import type { PlanGoalStrategy } from '../../../../memory/resume/session-resume-decision.types';
import type { SessionResumeDecision } from '../../../../memory/resume/session-resume-decision.types';
import { resumeDecisionKeepsActiveTask } from '../../../../memory/resume/session-resume-decision.types';

export type { PlanGoalStrategy };

/** Plan 轴：本轮用户话 vs 跨轮任务目标（goal 策略由 Resume Gate 决定）。 */
export type PlanTurnAxes = {
  turnMessage: string;
  goal: string;
  originalUserRequest: string;
  inheritedFromActiveTask: boolean;
  goalStrategy: PlanGoalStrategy;
};

const ACTIVE_TASK_STATUSES = new Set(['in_progress', 'awaiting_confirmation']);

function readActiveTaskSummary(
  memory: PlanSessionWorkingMemory | null | undefined,
): PlanSessionWorkingMemory['activeTask'] | null {
  return memory?.activeTask ?? null;
}

/**
 * 根据 Resume Gate 下发的 goalStrategy 解析 plan 轴（Plan 层不独立判断用户意图）。
 */
export function resolvePlanTurnAxes(input: {
  turnMessage: string;
  goalStrategy: PlanGoalStrategy;
  sessionWorkingMemory?: PlanSessionWorkingMemory | null;
  contract?: Pick<TurnExecutionContract, 'taskKind' | 'plan'> | null;
}): PlanTurnAxes {
  const turnMessage = input.turnMessage.trim();
  const active = readActiveTaskSummary(input.sessionWorkingMemory);
  const canInherit =
    input.goalStrategy === 'inherit_active_task' &&
    input.contract?.taskKind === 'orchestrated_read' &&
    input.contract.plan.allowSessionResume !== false &&
    active != null &&
    ACTIVE_TASK_STATUSES.has(active.status) &&
    active.goal.trim().length > 0 &&
    active.originalUserRequest.trim().length > 0;

  if (canInherit) {
    return {
      turnMessage,
      goal: active!.goal.trim(),
      originalUserRequest: active!.originalUserRequest.trim(),
      inheritedFromActiveTask: true,
      goalStrategy: input.goalStrategy,
    };
  }

  const fallbackGoal =
    turnMessage.length > 0 ? turnMessage : 'Complete the user request';
  return {
    turnMessage,
    goal: fallbackGoal,
    originalUserRequest: fallbackGoal,
    inheritedFromActiveTask: false,
    goalStrategy: 'use_turn_message',
  };
}

/** fresh plan 时是否应 abandon activeTask（以 Resume Gate 决策为准）。 */
export function shouldAbandonActiveTaskForFreshPlan(input: {
  contract: Pick<TurnExecutionContract, 'plan'>;
  resumeDecision: SessionResumeDecision;
}): boolean {
  if (input.resumeDecision.action === 'abandon_and_fresh') {
    return false;
  }
  if (resumeDecisionKeepsActiveTask(input.resumeDecision)) {
    return false;
  }
  if (!input.contract.plan.abandonActiveTaskOnFreshPlan) {
    return false;
  }
  return input.resumeDecision.action === 'fresh';
}
