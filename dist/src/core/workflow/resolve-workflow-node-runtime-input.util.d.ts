import type { WorkflowNodeDef } from './workflow.types';
import type { WorkflowNodeInputByAction } from './workflow-node-input.types';
export declare function resolveWorkflowNodeRuntimeInput<A extends WorkflowNodeDef['action']>(def: WorkflowNodeDef<A>): WorkflowNodeInputByAction[A];
