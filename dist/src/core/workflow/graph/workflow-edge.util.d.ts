import type { WorkflowEdge, WorkflowEdgeKind, WorkflowNodeDef, WorkflowValidationIssue } from '../workflow.types';
export declare function resolveWorkflowEdgeKind(edge: WorkflowEdge): WorkflowEdgeKind;
export declare function synthesizeLinearWorkflowEdges(nodes: WorkflowNodeDef[]): WorkflowEdge[];
export declare function tryParseWorkflowEdge(row: unknown, index: number): {
    ok: true;
    edge: WorkflowEdge;
} | {
    ok: false;
    issue: WorkflowValidationIssue;
};
export declare function parseWorkflowEdgesJsonStrict(value: unknown): {
    edges: WorkflowEdge[];
    issues: WorkflowValidationIssue[];
};
export type ParsedWorkflowGraph = {
    nodes: WorkflowNodeDef[];
    edges: WorkflowEdge[];
    entryNodeId: string | null;
    edgesDeclared: boolean;
    edgeParseIssues: WorkflowValidationIssue[];
};
export declare function parseWorkflowGraphJson(value: unknown): ParsedWorkflowGraph;
export declare function serializeWorkflowGraphJson(input: {
    nodes: WorkflowNodeDef[];
    edges?: WorkflowEdge[];
    entryNodeId?: string | null;
}): unknown;
export declare function listOutgoingEdges(edges: WorkflowEdge[], fromNodeId: string): WorkflowEdge[];
export declare function listClueEdgesFrom(edges: WorkflowEdge[], fromNodeId: string): WorkflowEdge[];
export declare function findDefaultEdgeFrom(edges: WorkflowEdge[], fromNodeId: string): WorkflowEdge | null;
export declare function listAlwaysEdgesFrom(edges: WorkflowEdge[], fromNodeId: string): WorkflowEdge[];
