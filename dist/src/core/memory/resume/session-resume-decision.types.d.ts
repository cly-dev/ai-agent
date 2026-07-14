import type { WorkflowRunState } from '../../workflow/workflow.types';
import type { StoredTaskPlan } from '../goa/session-goa.types';
export type PlanGoalStrategy = 'inherit_active_task' | 'use_turn_message';
export type TaskResumeFollowUpKind = 'resume' | 'replan_same_goal' | 'new_topic';
export type SessionResumeDecision = {
    action: 'resume';
    plan: StoredTaskPlan;
    followUpReason: string | null;
    resumedFromRunId: number | null;
    workflowRun?: WorkflowRunState | null;
    goalStrategy: 'inherit_active_task';
} | {
    action: 'fresh_same_goal';
    followUpReason: string | null;
    goalStrategy: 'inherit_active_task';
} | {
    action: 'fresh';
    goalStrategy: 'use_turn_message';
    followUpReason?: string | null;
} | {
    action: 'abandon_and_fresh';
};
export declare function defaultFreshResumeDecision(): SessionResumeDecision;
export declare function goalStrategyFromResumeDecision(decision: SessionResumeDecision): PlanGoalStrategy;
export declare function resumeDecisionKeepsActiveTask(decision: SessionResumeDecision): boolean;
