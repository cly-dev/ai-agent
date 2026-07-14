import type { WorkflowNodeDef, WorkflowRunState } from '../../../../workflow/workflow.types';
import type { PlanObservationBuckets } from './plan-observation-scope.util';
import { type PlanScopedTool } from './task-plan.util';
import type { TaskPlanSnapshot, TaskPlanStep } from './task-plan.types';
import type { ToolObservation } from '../types/agent-engine.types';
export type PlanSummarizeGateStatus = 'not_answer_step' | 'allowed' | 'rewind_gather';
export type PlanSummarizeGateResult = {
    status: 'not_answer_step';
} | {
    status: 'allowed';
    reason: 'no_gather_required' | 'gather_evidence_present';
} | {
    status: 'rewind_gather';
    reason: 'gather_unsatisfied';
    rewindPlan: TaskPlanSnapshot;
    gatherStepId: string;
};
export declare function planSummarizeRequiresToolEvidence(plan: TaskPlanSnapshot | null | undefined): boolean;
export declare function firstUnsatisfiedGatherToolStep(input: {
    plan: TaskPlanSnapshot;
    observations: ToolObservation[];
    scopedTools?: PlanScopedTool[];
}): TaskPlanStep | null;
export declare function rewindPlanToGatherStep(plan: TaskPlanSnapshot, gatherStepId: string): TaskPlanSnapshot;
export declare function rewindWorkflowRunToPlanStep(input: {
    workflowRun: WorkflowRunState;
    plan: TaskPlanSnapshot;
    stepId: string;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
}): {
    workflowRun: WorkflowRunState;
    workflowAwaitingReact: boolean;
};
export declare function assessPlanSummarizeGate(input: {
    plan: TaskPlanSnapshot | null | undefined;
    observationBuckets: PlanObservationBuckets;
    scopedTools: PlanScopedTool[];
    workflowRun?: WorkflowRunState | null;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
}): PlanSummarizeGateResult;
export declare function applyPlanSummarizeRewind<T extends {
    taskPlan?: TaskPlanSnapshot | null;
    workflowRun?: WorkflowRunState | null;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
    workflowAwaitingReact?: boolean;
    pendingRespond?: unknown;
}>(state: T, gate: Extract<PlanSummarizeGateResult, {
    status: 'rewind_gather';
}>): T;
export declare function resolvePlanGatherRewindWhenToolsMissing(input: {
    plan: TaskPlanSnapshot | null | undefined;
    observationBuckets: PlanObservationBuckets;
    scopedTools: PlanScopedTool[];
    workflowRun?: WorkflowRunState | null;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
}): Extract<PlanSummarizeGateResult, {
    status: 'rewind_gather';
}> | null;
export declare function planSummarizeHasToolEvidence(input: {
    plan: TaskPlanSnapshot | null | undefined;
    observationBuckets: PlanObservationBuckets;
    scopedTools?: PlanScopedTool[];
    workflowRun?: WorkflowRunState | null;
}): boolean;
