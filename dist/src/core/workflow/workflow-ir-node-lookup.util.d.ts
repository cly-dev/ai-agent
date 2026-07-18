import type { WorkflowIrDocument, WorkflowIrNode } from './workflow-ir.types';
import type { WorkflowNodeDef } from './workflow.types';
export declare function isMaterializedExpandSubStep(def: WorkflowNodeDef): boolean;
export declare function indexWorkflowIrNodesById(ir: WorkflowIrDocument): Map<string, WorkflowIrNode>;
export declare function resolveSourceIrNode(def: WorkflowNodeDef, ir: WorkflowIrDocument): WorkflowIrNode | undefined;
