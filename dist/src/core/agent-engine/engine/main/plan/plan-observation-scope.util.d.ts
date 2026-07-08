import type { AgentGraphState, ToolObservation } from '../types/agent-engine.types';
export type PlanRunContext = 'fresh' | 'resume';
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
