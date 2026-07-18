import type { WorkflowEdge, WorkflowNodeDef } from './workflow.types';
import type { WorkflowIrDocument } from './workflow-ir.types';
export declare function lowerWorkflowIrToLegacyGraph(ir: WorkflowIrDocument): {
    nodes: WorkflowNodeDef[];
    edges: WorkflowEdge[];
    entryNodeId: string;
};
