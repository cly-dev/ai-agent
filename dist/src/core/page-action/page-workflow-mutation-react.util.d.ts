import type { PageWorkflowExecutorRuntime } from '../workflow/page/page-workflow-runtime.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../workflow/workflow.types';
import type { ApprovalPendingWrite } from '../approval/approval-resume-snapshot.types';
export type PageWorkflowReactResult = {
    ok: true;
    workflowRun: WorkflowRunState;
    outputRef: string;
    nodeOutput: unknown;
} | {
    ok: false;
    workflowRun: WorkflowRunState;
    errorCode: string;
    errorMessage: string;
};
export declare function runPageWorkflowMutationReact(input: {
    def: WorkflowNodeDef;
    nodeId: string;
    workflowRun: WorkflowRunState;
    runtime: PageWorkflowExecutorRuntime;
    allowedToolIds: number[];
    pendingWrite?: ApprovalPendingWrite | null;
}): Promise<PageWorkflowReactResult>;
