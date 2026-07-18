import type { WorkflowIrDocument, WorkflowIrNode } from './workflow-ir.types';
import type { WorkflowEdge, WorkflowNodeDef } from './workflow.types';
export type MaterializedWorkflowGraph = {
    nodes: WorkflowNodeDef[];
    edges: WorkflowEdge[];
    entryNodeId: string;
    materializedDirectFromIr: boolean;
    ir: WorkflowIrDocument;
};
export declare function materializeDirectIrNode(node: WorkflowIrNode): WorkflowNodeDef;
export declare function materializeExpandIrNode(node: WorkflowIrNode): WorkflowNodeDef[];
export declare function materializeIrNodeToDefs(node: WorkflowIrNode): WorkflowNodeDef[];
export declare function workflowIrHasExpandTypes(ir: WorkflowIrDocument): boolean;
export declare function materializeWorkflowGraphFromIr(ir: WorkflowIrDocument): MaterializedWorkflowGraph;
export declare function workflowIrNeedsLegacyLower(_ir: WorkflowIrDocument): boolean;
