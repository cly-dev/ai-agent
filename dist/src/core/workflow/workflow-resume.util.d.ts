import type { PrismaService } from '../../prisma/prisma.service';
import type { TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
import type { WorkflowEdge, WorkflowNodeDef, WorkflowRunState } from './workflow.types';
export declare function isResumableWorkflowRun(run: WorkflowRunState | null | undefined): run is WorkflowRunState;
export type WorkflowResumeResolvedGraph = {
    nodes: WorkflowNodeDef[];
    edges: WorkflowEdge[] | null;
};
export declare function resolveWorkflowGraphForResume(prisma: PrismaService, input: {
    savedRun: WorkflowRunState;
    taskPlan: TaskPlanSnapshot;
    appClientId: number;
    scope?: {
        allowedToolIds: number[];
        allowedHostToolIds: number[];
    };
}): Promise<WorkflowResumeResolvedGraph | null>;
export declare function shouldAwaitReactOnWorkflowResume(run: WorkflowRunState, defs: WorkflowNodeDef[]): boolean;
export type WorkflowResumeGraphSlice = {
    workflowRun: WorkflowRunState;
    workflowNodeDefs: WorkflowNodeDef[];
    workflowAwaitingReact: boolean;
};
export declare function hydrateTaskPlanWithWorkflowDefs(input: {
    taskPlan: TaskPlanSnapshot | null | undefined;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
}): TaskPlanSnapshot | null;
export declare function prepareTaskPlanForWorkflowWriteConfirmResume(input: {
    taskPlan: TaskPlanSnapshot | null | undefined;
    workflowRunBeforeAdvance: WorkflowRunState;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
    workflowRunAfterAdvance?: WorkflowRunState | null;
}): TaskPlanSnapshot | null;
export declare function advanceWorkflowRunAfterWriteConfirm(run: WorkflowRunState): WorkflowRunState;
export declare function workflowRunHasPendingNodes(run: WorkflowRunState | null | undefined): boolean;
export declare function buildWorkflowResumeGraphSlice(input: {
    savedRun: WorkflowRunState;
    nodes: WorkflowNodeDef[];
    edges?: WorkflowEdge[] | null;
}): WorkflowResumeGraphSlice;
