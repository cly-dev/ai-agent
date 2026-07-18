import type { WorkflowIrNode } from './workflow-ir.types';
import type { WorkflowActionKind, WorkflowNodeDef } from './workflow.types';
export type WorkflowIrNativePhase = 'execute' | 'draft' | 'present' | 'await';
export declare function resolveWorkflowIrNativePhases(node: WorkflowIrNode): WorkflowIrNativePhase[];
export declare function actionForWorkflowIrNativePhase(node: WorkflowIrNode, phase: WorkflowIrNativePhase): WorkflowActionKind;
export declare function materializeWorkflowIrNodeForPhase(node: WorkflowIrNode, phase: WorkflowIrNativePhase): WorkflowNodeDef;
export declare function nextWorkflowIrNativePhase(node: WorkflowIrNode, current: WorkflowIrNativePhase): WorkflowIrNativePhase | null;
