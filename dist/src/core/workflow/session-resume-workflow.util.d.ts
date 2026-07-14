import type { TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
import { type WorkflowResumeGraphSlice } from './workflow-resume.util';
import type { WorkflowRunState } from './workflow.types';
export declare function tryBuildSessionResumeWorkflowSlice(input: {
    workflowRun: WorkflowRunState | null | undefined;
    taskPlan: TaskPlanSnapshot;
}): WorkflowResumeGraphSlice | null;
