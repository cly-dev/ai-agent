export type WorkflowIrNodeCategory = 'trigger' | 'data' | 'ai' | 'control' | 'action' | 'system';
export type WorkflowIrNodeType = 'event_trigger' | 'schedule_trigger' | 'webhook_trigger' | 'context_read' | 'data_query' | 'data_transform' | 'merge' | 'llm' | 'structured_output' | 'embedding' | 'retrieval' | 'rerank' | 'condition' | 'router' | 'parallel' | 'join' | 'loop' | 'delay' | 'tool_call' | 'http_call' | 'host_effect' | 'message_send' | 'human_task' | 'catch_error' | 'sub_workflow';
export type WorkflowIrRetryPolicy = {
    maxAttempts: number;
    backoffMs?: number;
};
export type WorkflowIrNode = {
    id: string;
    type: WorkflowIrNodeType;
    name?: string;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    config: Record<string, unknown>;
    retry?: WorkflowIrRetryPolicy;
    timeoutMs?: number;
};
export type WorkflowIrDocument = {
    version: 1;
    entryNodeId: string;
    nodes: WorkflowIrNode[];
    edges: Array<{
        id: string;
        from: string;
        to: string;
        kind?: 'always' | 'when' | 'default';
        when?: string;
        whenDescription?: string;
    }>;
};
export declare const WORKFLOW_IR_IMPLEMENTED_TYPES: readonly ["data_query", "data_transform", "llm", "structured_output", "tool_call", "host_effect", "message_send", "human_task"];
export type WorkflowIrImplementedType = (typeof WORKFLOW_IR_IMPLEMENTED_TYPES)[number];
export declare const WORKFLOW_IR_BANNED_LEGACY_ACTIONS: readonly ["load_page_context", "summarize_images", "detect_clues", "generate_and_push"];
export declare function workflowIrCategoryOf(type: WorkflowIrNodeType): WorkflowIrNodeCategory;
