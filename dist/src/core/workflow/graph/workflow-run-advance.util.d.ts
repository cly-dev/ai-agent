import type { DetectCluesOutput, WorkflowEdge, WorkflowRunState } from '../workflow.types';
export declare function applyDetectCluesRouting(input: {
    run: WorkflowRunState;
    edges: WorkflowEdge[];
    fromNodeId: string;
    output: DetectCluesOutput;
    now?: string;
}): WorkflowRunState;
export declare function advanceWorkflowRunAlongEdges(input: {
    run: WorkflowRunState;
    edges: WorkflowEdge[];
}): WorkflowRunState;
export declare function resolveEntryNodeId(input: {
    nodes: {
        id: string;
    }[];
    entryNodeId?: string | null;
}): string | null;
