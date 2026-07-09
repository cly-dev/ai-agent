export type AgentMachineCode = 'INTENT_RECALL_FAILED' | 'SKILL_NOT_VISIBLE' | 'SKILL_TOOLS_EMPTY' | 'SKILL_NOT_IN_SCOPE' | 'SKILL_EXPAND_FAILED' | 'TOOL_AUTH_FAILED' | 'TOOL_TIMEOUT' | 'TOOL_EMPTY_RESULT' | 'TOOL_DOWNSTREAM_ERROR' | 'LLM_TIMEOUT' | 'LLM_RATE_LIMIT' | 'WRITE_CONFIRMATION_REQUIRED';
export type AgentToolErrorObservation = {
    _agentToolError: true;
    userHint: string;
    detail: string;
    code: AgentMachineCode;
    responseSource?: unknown;
    httpStatus?: number;
};
export type BuildToolErrorObservationContext = {
    isMutation?: boolean;
};
export declare function isAgentToolErrorObservation(output: unknown): output is AgentToolErrorObservation;
export declare function extractToolErrorUserHint(output: unknown): string | null;
export declare function extractToolErrorCode(output: unknown): AgentMachineCode | null;
export declare function extractToolErrorResponseSource(output: unknown): unknown;
export declare function formatResponseSourceForDisplay(source: unknown): string;
export declare function buildToolErrorObservation(error: unknown, context?: BuildToolErrorObservationContext): AgentToolErrorObservation;
export declare function buildToolFailureUserMessage(error: unknown, context?: {
    isMutation?: boolean;
    httpStatus?: number;
    responseSource?: unknown;
}): string;
export declare function buildIntentScopeFailureUserMessage(): string;
export declare function buildLlmFailureUserMessage(error: unknown): string;
export declare function resolveToolFailureCode(error: unknown, context?: {
    httpStatus?: number;
}): AgentMachineCode;
export declare function resolveLlmFailureCode(error: unknown): AgentMachineCode;
export declare function resolveAgentRunFailureUserMessage(error: unknown): string | null;
export declare function resolveAgentRunFailureCode(error: unknown): AgentMachineCode | null;
