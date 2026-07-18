import type { WorkflowNodeDef } from './workflow.types';
import type { WorkflowIrDocument } from './workflow-ir.types';
import type { WorkflowExecutionMode } from './workflow-ir-native-direct.util';
import type { AgentGraphState } from '../agent-engine/engine/main/types/agent-engine.types';
export declare function getWorkflowNodeDef(defs: WorkflowNodeDef[] | undefined, nodeId: string | null | undefined): WorkflowNodeDef | undefined;
export declare function resolveWorkflowNodeDefForExecute(input: {
    nodeId: string;
    defs?: WorkflowNodeDef[] | null;
    ir?: WorkflowIrDocument | null;
    executionMode?: WorkflowExecutionMode | null;
    phase?: import('./workflow-ir-native-phase.util').WorkflowIrNativePhase | null;
}): WorkflowNodeDef | undefined;
export declare function getCurrentWorkflowNode(state: AgentGraphState): import("./workflow.types").WorkflowRunNodeState;
export declare function routeAfterWorkflowInit(state: AgentGraphState): 'summarize' | 'execute_node' | '__end__';
export declare function routeAfterExecuteNode(state: AgentGraphState): 'workflow_advance' | 'workflow_react' | 'summarize' | '__end__';
export declare function routeAfterWorkflowReact(state: AgentGraphState): 'workflow_advance' | 'execute_node' | 'summarize' | '__end__';
export declare function routeAfterWorkflowAdvance(state: AgentGraphState): 'execute_node' | 'summarize' | '__end__';
export declare function routeAfterSummarizeWorkflowAxis(state: AgentGraphState, resumeFromWriteConfirm: boolean): 'workflow_advance' | 'workflow_react' | 'tools' | 'execute_node' | '__end__';
export declare function routeResultCheckWorkflowAxis(state: AgentGraphState): 'workflow_advance' | null;
