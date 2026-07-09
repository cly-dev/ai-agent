import type { WorkflowActionKind } from '../workflow.types';
import type { PageWorkflowExecutorRuntime } from './page-workflow-runtime.types';
import type { WorkflowExecutorOutcome } from '../executors/workflow-executor.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../workflow.types';
export type PageWorkflowNodeExecutionResult = {
    kind: 'completed';
    workflowRun: WorkflowRunState;
    outcome: Extract<WorkflowExecutorOutcome, {
        kind: 'completed';
    }>;
} | {
    kind: 'react';
    workflowRun: WorkflowRunState;
    outcome: Extract<WorkflowExecutorOutcome, {
        kind: 'delegate_react';
    }>;
} | {
    kind: 'suspend';
    workflowRun: WorkflowRunState;
    outcome: Extract<WorkflowExecutorOutcome, {
        kind: 'awaiting_user_confirm';
    }>;
    nodeId: string;
} | {
    kind: 'failed';
    workflowRun: WorkflowRunState;
    errorCode: string;
    errorMessage?: string;
};
export declare function executePageWorkflowNode(input: {
    def: WorkflowNodeDef;
    nodeId: string;
    workflowRun: WorkflowRunState;
    runtime: PageWorkflowExecutorRuntime;
    actionRunId: number;
    actionKey: string;
}): Promise<PageWorkflowNodeExecutionResult>;
export declare function recordPageWorkflowNodeStart(input: {
    action: WorkflowActionKind;
    nodeId: string;
    recorder: PageWorkflowExecutorRuntime['stepRecorder'];
}): void;
