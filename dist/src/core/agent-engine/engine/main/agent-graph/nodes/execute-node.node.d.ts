import type { AgentGraphNodeBundle, AgentGraphNodeFn } from '../types/graph.types';
import type { WorkflowNodeDef } from '../../../../../workflow/workflow.types';
export declare function createExecuteNodeNode(bundle: AgentGraphNodeBundle): AgentGraphNodeFn;
export declare function resolveExecuteNodeDef(defs: WorkflowNodeDef[] | undefined, nodeId: string | null | undefined): WorkflowNodeDef | undefined;
