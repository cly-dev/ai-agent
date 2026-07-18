import type { WorkflowIrNodeType } from '../workflow-ir.types';
import type { WorkflowActionKind, WorkflowNodeDef } from '../workflow.types';
import type { WorkflowExecutor } from './workflow-executor.types';
export type WorkflowNodeExecutorDispatchKind = 'ir_direct' | 'ir_expand_adapter' | 'legacy_action';
export type ResolvedWorkflowNodeExecutor = {
    executor: WorkflowExecutor | null;
    action: WorkflowActionKind;
    dispatchKind: WorkflowNodeExecutorDispatchKind;
    irType?: WorkflowIrNodeType;
    irNodeId?: string;
};
export declare function resolveWorkflowNodeExecutor(def: WorkflowNodeDef, profile?: 'chat' | 'page'): ResolvedWorkflowNodeExecutor;
export declare function workflowNodesAreIrDispatched(nodes: WorkflowNodeDef[]): boolean;
