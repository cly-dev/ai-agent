import type { ResolveOuterPlanInput, ResolveTaskPlanResult, TaskDeliverable } from './task-plan.types';
import type { PlanTurnAxes } from './plan-turn-context.util';
export declare function resolveOrchestratedReadPlanResult(input: {
    planInput: ResolveOuterPlanInput;
    deliverable: TaskDeliverable;
    planAxes: PlanTurnAxes;
}): ResolveTaskPlanResult;
