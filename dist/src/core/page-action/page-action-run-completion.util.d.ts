import type { PageWorkflowExecutorRuntime } from '../workflow/page/page-workflow-runtime.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../workflow/workflow.types';
export type PageActionRunCompletion = {
    kind: 'suspended';
    approvalRequestId: number;
} | {
    kind: 'failed';
    errorCode: string;
    errorMessage: string;
} | {
    kind: 'text';
    fillText: string;
    dslOutcome?: string | null;
} | {
    kind: 'http_write';
    nodeId: string;
    toolName?: string | null;
} | {
    kind: 'http_read';
    nodeId: string;
    toolName?: string | null;
} | {
    kind: 'workflow_done';
};
export declare function completionFromHostFill(input: {
    fillText: string;
    dslOutcome: string | null;
}): PageActionRunCompletion;
export declare function completionFromSummarizeText(summaryText: string, dslOutcome?: string | null): PageActionRunCompletion;
export declare function resolvePageWorkflowCompletion(input: {
    workflowNodes: WorkflowNodeDef[];
    workflowRun: WorkflowRunState;
    runtime: Pick<PageWorkflowExecutorRuntime, 'fillText' | 'dslOutcome' | 'nodeOutputs'>;
    errorCode?: string | null;
    errorMessage?: string | null;
    suspended?: boolean;
    approvalRequestId?: number | null;
}): PageActionRunCompletion;
