import type { TaskPlanAdvanceResult, TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
import type { WorkflowNodeDef, WorkflowRunState } from './workflow.types';
export declare function newlyCompletedPlanStepIds(planBefore: TaskPlanSnapshot, planAfter: TaskPlanSnapshot): string[];
export declare function syncWorkflowRunAfterPlanAdvance(input: {
    workflowRun: WorkflowRunState;
    planBefore: TaskPlanSnapshot;
    planAdvance: TaskPlanAdvanceResult;
}): WorkflowRunState;
export declare function projectTaskPlanFromWorkflowRun(input: {
    taskPlan: TaskPlanSnapshot | null | undefined;
    workflowRun: WorkflowRunState;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
}): TaskPlanSnapshot | null;
export declare function applyWorkflowTaskPlanProjection<T extends {
    taskPlan?: TaskPlanSnapshot | null;
    workflowRun?: WorkflowRunState | null;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
}>(state: T): T;
export declare function deriveWorkflowAwaitingReact(input: {
    workflowRun?: WorkflowRunState | null;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
}): boolean;
export declare function workflowNodeRequiresReactLoop(def: WorkflowNodeDef | undefined): boolean;
export declare function projectTaskPlanFromWorkflowAdvance(input: {
    taskPlan: TaskPlanSnapshot | null | undefined;
    completedNodeId: string;
}): TaskPlanSnapshot | null;
export declare function syncTaskPlanAfterWorkflowNodeComplete(input: {
    taskPlan: TaskPlanSnapshot | null | undefined;
    completedNodeId: string;
}): TaskPlanSnapshot | null;
export declare function ensureWorkflowNodeStarted(run: WorkflowRunState, nodeId: string, now?: string): WorkflowRunState;
export declare function mirrorWorkflowRunAfterPlanAdvance(input: {
    workflowRun: WorkflowRunState;
    planBefore: TaskPlanSnapshot;
    planAdvance: TaskPlanAdvanceResult;
}): WorkflowRunState;
export declare function completeWorkflowNodeFromSummarize(run: WorkflowRunState, nodeId: string, outputRef?: string, now?: string): WorkflowRunState;
