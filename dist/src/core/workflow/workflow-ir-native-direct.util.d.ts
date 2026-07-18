import { type WorkflowIrNativePhase } from './workflow-ir-native-phase.util';
import type { WorkflowIrDocument, WorkflowIrNode } from './workflow-ir.types';
import type { WorkflowEdge, WorkflowNodeDef } from './workflow.types';
export type WorkflowExecutionMode = 'ir_native_direct' | 'materialized_expand';
export declare function isWorkflowIrNodeNativeFlat(node: WorkflowIrNode): boolean;
export declare function isWorkflowIrNativeDirectEligible(ir: WorkflowIrDocument): boolean;
export declare function irEdgesToWorkflowEdges(ir: WorkflowIrDocument): WorkflowEdge[];
export type NativeDirectGraphFromIr = {
    nodes: WorkflowNodeDef[];
    edges: WorkflowEdge[];
    entryNodeId: string;
    ir: WorkflowIrDocument;
    executionMode: 'ir_native_direct';
    materializedDirectFromIr: true;
    phasesByNodeId: Record<string, WorkflowIrNativePhase>;
};
export declare function materializeNativeFlatIrNode(node: WorkflowIrNode): WorkflowNodeDef;
export declare function buildNativeDirectGraphFromIr(ir: WorkflowIrDocument): NativeDirectGraphFromIr;
