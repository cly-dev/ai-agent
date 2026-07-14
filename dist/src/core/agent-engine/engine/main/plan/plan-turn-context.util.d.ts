import type { PlanSessionWorkingMemory } from './task-plan.types';
import type { TurnExecutionContract } from '../../turn/turn-execution-contract.types';
import type { PlanGoalStrategy } from '../../../../memory/resume/session-resume-decision.types';
import type { SessionResumeDecision } from '../../../../memory/resume/session-resume-decision.types';
export type { PlanGoalStrategy };
export type PlanTurnAxes = {
    turnMessage: string;
    goal: string;
    originalUserRequest: string;
    inheritedFromActiveTask: boolean;
    goalStrategy: PlanGoalStrategy;
};
export declare function resolvePlanTurnAxes(input: {
    turnMessage: string;
    goalStrategy: PlanGoalStrategy;
    sessionWorkingMemory?: PlanSessionWorkingMemory | null;
    contract?: Pick<TurnExecutionContract, 'taskKind' | 'plan'> | null;
}): PlanTurnAxes;
export declare function shouldAbandonActiveTaskForFreshPlan(input: {
    contract: Pick<TurnExecutionContract, 'plan'>;
    resumeDecision: SessionResumeDecision;
}): boolean;
