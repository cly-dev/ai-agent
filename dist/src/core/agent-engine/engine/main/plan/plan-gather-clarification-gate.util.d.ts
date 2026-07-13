import type { WorkflowRunState } from '../../../../workflow/workflow.types';
import type { PlanObservationBuckets } from './plan-observation-scope.util';
import type { TaskPlanSnapshot } from './task-plan.types';
import type { PendingRespond } from '../../turn/turn-respond.types';
export declare function isParamGateSourcedClarification(input: {
    readinessReason?: unknown;
}): boolean;
export declare function isGatherPendingWithoutToolExecution(input: {
    taskPlan?: TaskPlanSnapshot | null;
    workflowRun?: WorkflowRunState | null;
    observationBuckets: PlanObservationBuckets;
}): boolean;
export declare function isPrematureGatherClarification(input: {
    taskPlan?: TaskPlanSnapshot | null;
    workflowRun?: WorkflowRunState | null;
    observationBuckets: PlanObservationBuckets;
    pendingRespond: PendingRespond | null | undefined;
}): boolean;
