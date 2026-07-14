import type { TaskPlanAdvanceResult, TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
import type { ToolObservation } from '../agent-engine/engine/main/types/agent-engine.types';
import type { WorkflowNodeDef, WorkflowRunState } from './workflow.types';
export declare function isWorkflowBoundRun(workflowRun?: WorkflowRunState | null): boolean;
export type WorkflowPlanTransitionOptions = {
    clearWorkflowAwaitingReact?: boolean;
};
export declare function applyPlanAdvanceAsWorkflowProgress(input: {
    taskPlan: TaskPlanSnapshot | null | undefined;
    workflowRun?: WorkflowRunState | null;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
    workflowAwaitingReact?: boolean;
    planBefore: TaskPlanSnapshot;
    planAdvance: TaskPlanAdvanceResult | null;
    options?: WorkflowPlanTransitionOptions;
}): {
    taskPlan: TaskPlanSnapshot | null | undefined;
    workflowRun?: WorkflowRunState;
    workflowAwaitingReact?: boolean;
};
export declare function applyComposeMutationProgress(input: {
    taskPlan: TaskPlanSnapshot;
    workflowRun?: WorkflowRunState | null;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
    workflowAwaitingReact?: boolean;
    planStepId: string;
    composeObservation: ToolObservation;
}): {
    taskPlan: TaskPlanSnapshot;
    workflowRun?: WorkflowRunState;
    workflowAwaitingReact?: boolean;
    composeObservation: ToolObservation;
};
