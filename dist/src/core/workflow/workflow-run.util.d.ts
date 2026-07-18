import type { WorkflowEdge, WorkflowNodeDef, WorkflowRunCompiledFrom, WorkflowRunState, WorkflowRunStatus } from './workflow.types';
import type { WorkflowIrNode } from './workflow-ir.types';
export declare function cloneWorkflowRun(run: WorkflowRunState): WorkflowRunState;
export declare function initWorkflowRun(input: {
    workflowId: number;
    version: number;
    nodes: WorkflowNodeDef[];
    edges?: WorkflowEdge[] | null;
    entryNodeId?: string | null;
    compiledFrom?: WorkflowRunCompiledFrom;
    now?: string;
    phasesByNodeId?: Record<string, import('./workflow-ir-native-phase.util').WorkflowIrNativePhase>;
}): WorkflowRunState;
export declare function startWorkflowNode(run: WorkflowRunState, nodeId: string, now?: string): WorkflowRunState;
export declare function completeWorkflowNode(run: WorkflowRunState, nodeId: string, outputRef?: string, now?: string): WorkflowRunState;
export declare function completeWorkflowNodeOrAdvancePhase(input: {
    run: WorkflowRunState;
    nodeId: string;
    irNode: WorkflowIrNode;
    outputRef?: string;
    now?: string;
}): {
    workflowRun: WorkflowRunState;
    advancedPhase: boolean;
};
export declare function tryAdvanceNativePhaseAfterNodeSuccess(input: {
    run: WorkflowRunState;
    nodeId: string;
    irNode: WorkflowIrNode;
}): {
    workflowRun: WorkflowRunState;
    advancedPhase: boolean;
};
export declare function failWorkflowNode(run: WorkflowRunState, nodeId: string, error: {
    code: string;
    message: string;
}, now?: string): WorkflowRunState;
export declare function skipWorkflowNode(run: WorkflowRunState, nodeId: string, now?: string): WorkflowRunState;
export declare function advanceWorkflowRun(run: WorkflowRunState, edges?: WorkflowEdge[] | null): WorkflowRunState;
export declare function finalizeWorkflowRun(run: WorkflowRunState, status: Extract<WorkflowRunStatus, 'completed' | 'failed' | 'cancelled'>): WorkflowRunState;
export declare function getWorkflowRunNode(run: WorkflowRunState, nodeId: string): WorkflowRunState['nodes'][number] | null;
export declare function allWorkflowNodesTerminal(run: WorkflowRunState): boolean;
export declare function finalizeWorkflowRunAfterAdvance(run: WorkflowRunState): WorkflowRunState;
