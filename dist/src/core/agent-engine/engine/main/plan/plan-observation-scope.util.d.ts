import type { SessionResumeDecision } from '../../../../memory/resume/session-resume-decision.types';
import type { AgentGraphState, ToolObservation } from '../types/agent-engine.types';
export type PlanRunContext = 'fresh' | 'resume' | 'fresh_same_goal';
export declare function planRunContextFromResumeDecision(decision: SessionResumeDecision): PlanRunContext;
export declare function allowsWorkingMemoryForPlanAnswer(planRunContext: PlanRunContext): boolean;
export type PlanObservationBuckets = {
    preloaded: ToolObservation[];
    runOwned: ToolObservation[];
};
export declare function selectObservationsForPlanToolSatisfaction(buckets: PlanObservationBuckets): ToolObservation[];
export declare function selectObservationsForPagedGatherResume(buckets: PlanObservationBuckets): ToolObservation[];
export declare function planObservationBucketsFromState(state: Pick<AgentGraphState, 'preloadedToolObservations' | 'toolObservations'>): PlanObservationBuckets;
export declare function planRunContextFromState(state: Pick<AgentGraphState, 'planRunContext'>): PlanRunContext;
export declare function resolveInitialPlanRunContext(input: {
    resumeFromWriteConfirm?: boolean;
    graphInitialState?: Pick<AgentGraphState, 'planRunContext' | 'taskPlan'> | null;
}): PlanRunContext;
