import type { WorkflowNodeInputByAction } from './workflow-node-input.types';
export type { WorkflowNodeInput, WorkflowNodeInputByAction } from './workflow-node-input.types';
export type WorkflowProfile = 'chat_skill' | 'page_action' | 'shared';
export type WorkflowActionKind = 'load_page_context' | 'detect_clues' | 'fetch_data' | 'summarize_images' | 'generate_and_push' | 'summarize' | 'compose_mutation' | 'present_mutation' | 'write_data' | 'await_user_confirm';
export type WorkflowNodeStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped';
export declare const WORKFLOW_NODE_STATUSES: readonly WorkflowNodeStatus[];
export type WorkflowNodeTerminalStatus = Extract<WorkflowNodeStatus, 'succeeded' | 'failed' | 'skipped'>;
export type WorkflowRunStatus = 'running' | 'completed' | 'failed' | 'cancelled';
export type WorkflowRunCompiledFrom = 'workflow_db' | 'plan_llm' | 'template' | 'minimal' | 'resume' | 'legacy_config';
export type WorkflowEdgeKind = 'always' | 'clue' | 'default';
export type WorkflowClueDef = {
    key: string;
    description: string;
};
export type WorkflowEdge = {
    id: string;
    from: string;
    to: string;
    kind?: WorkflowEdgeKind;
    clue?: WorkflowClueDef;
};
export type WorkflowNodeDef<A extends WorkflowActionKind = WorkflowActionKind> = {
    id: string;
    action: A;
    name: string;
    objective: string;
    input: WorkflowNodeInputByAction[A];
};
export type DetectClueItemResult = {
    key: string;
    matched: boolean;
    confidence: number;
    value: string | null;
    reason: string;
};
export type DetectCluesOutput = {
    clues: DetectClueItemResult[];
    matchedClueKeys: string[];
};
export type WorkflowRunRoutingState = {
    pendingNodeIds: string[];
};
export type WorkflowDefinition = {
    workflowKey: string;
    name: string;
    profile: WorkflowProfile;
    goal?: string | null;
    constraints?: string[];
    nodes: WorkflowNodeDef[];
    edges?: WorkflowEdge[];
    entryNodeId?: string;
};
export type WorkflowBindingRefs = {
    toolIds: number[];
    hostToolIds: number[];
};
export type WorkflowRunNodeState = {
    nodeId: string;
    action: WorkflowActionKind;
    name: string;
    status: WorkflowNodeStatus;
    startedAt?: string;
    finishedAt?: string;
    outputRef?: string;
    error?: {
        code: string;
        message: string;
    };
};
export type WorkflowRunState = {
    workflowId: number;
    version: number;
    currentNodeId: string | null;
    status: WorkflowRunStatus;
    compiledFrom?: WorkflowRunCompiledFrom;
    nodes: WorkflowRunNodeState[];
    edges?: WorkflowEdge[];
    routing?: WorkflowRunRoutingState;
};
export type WorkflowValidationIssue = {
    path: string;
    code: string;
    message: string;
};
export type WorkflowOverrides = Record<string, {
    objective?: string;
}>;
