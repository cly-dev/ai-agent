import type { LlmChatMessage, LlmRole } from '../llm.types';
export type PromptBudgetCallKind = 'decision' | 'summarize' | 'plan' | 'routing' | 'compression' | 'gather_page_summary' | 'schema_inference' | 'default';
export type PromptBudgetHints = {
    callKind?: PromptBudgetCallKind;
    skipFit?: boolean;
    sessionId?: string;
    runId?: number;
    phase?: string;
};
export type DegradeLevel = 0 | 1 | 2 | 3 | 4;
export type PromptBlockKind = 'current_user_request' | 'plan_context' | 'plan_step_override' | 'tool_decision' | 'tool_schema' | 'host_tool_schema' | 'pending_write_tool_call' | 'current_run_observations' | 'working_memory_observations' | 'page_context' | 'session_goa' | 'session_history_summary' | 'session_history_guide' | 'session_history_turns' | 'summarize_context' | 'user_memory' | 'agent_prompt' | 'response_style' | 'message_blocks_spec' | 'tool_result_legacy' | 'other';
export type ObservationPayload = {
    tool: string;
    executed?: boolean;
    source?: string;
    internal?: boolean;
    args?: Record<string, unknown>;
    reuseNote?: string;
    success?: boolean;
    summary?: Record<string, unknown>;
    records?: Record<string, unknown>[];
    error?: string;
};
export type SessionGoaSection = 'coverage' | 'episodes' | 'artifacts' | 'inventory' | 'active_task' | 'entities' | 'unknown';
export type PromptBlockPayload = {
    type: 'text';
    text: string;
} | {
    type: 'observations';
    observations: ObservationPayload[];
    preamble?: string;
} | {
    type: 'tool_schema';
    json: string;
} | {
    type: 'session_goa';
    section: SessionGoaSection;
    text: string;
};
export type PromptBlock = {
    id: string;
    kind: PromptBlockKind;
    priority: number;
    degradeLevel: DegradeLevel;
    maxDegradeLevel: DegradeLevel;
    role: LlmRole;
    toolCallId?: string;
    payload: PromptBlockPayload;
    sourceMessageIndex: number;
};
export type FitDegradationRecord = {
    blockId: string;
    kind: PromptBlockKind;
    sourceMessageIndex: number;
    fromLevel: DegradeLevel;
    toLevel: DegradeLevel;
    tokensBefore?: number;
    tokensAfter?: number;
    note?: string;
};
export type FitReport = {
    enabled: boolean;
    skipped: boolean;
    callKind?: PromptBudgetCallKind;
    budget: number;
    tokensBefore: number;
    tokensAfter: number;
    fitted: boolean;
    degradations: FitDegradationRecord[];
    warnings: string[];
};
export type FitMessagesResult = {
    messages: LlmChatMessage[];
    report: FitReport;
};
export type CallKindPolicy = {
    skipFit?: boolean;
    maxDegradeLevelByKind?: Partial<Record<PromptBlockKind, DegradeLevel>>;
};
