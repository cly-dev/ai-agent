import type { ActiveTaskStatus, StoredTaskPlan, TaskStepProgress } from '../memory/goa/session-goa.types';
import type { WorkflowRunState } from './workflow.types';
export declare function buildStepProgressFromWorkflowRun(input: {
    workflowRun: WorkflowRunState;
    plan: StoredTaskPlan;
}): TaskStepProgress[];
export declare function resolveActiveTaskStatusFromWorkflow(input: {
    workflowRun: WorkflowRunState;
    plan: StoredTaskPlan;
    runStatus?: 'success' | 'failed';
    awaitingWriteConfirmation?: boolean;
}): ActiveTaskStatus;
export declare function formatWorkflowRunPendingSummary(workflowRun: WorkflowRunState): string;
