import type { WorkflowIrNode } from '../workflow-ir.types';
import type { WorkflowRunState } from '../workflow.types';
import type { WorkflowExecutorHost, WorkflowExecutorOutcome } from './workflow-executor.types';
export declare function executeWorkflowIrNode(input: {
    host: WorkflowExecutorHost;
    irNode: WorkflowIrNode;
    nodeId: string;
    workflowRun: WorkflowRunState;
}): Promise<WorkflowExecutorOutcome>;
