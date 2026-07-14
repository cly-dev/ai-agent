import { type AgentMachineCode } from '../agent-run-user-messages.util';
export type ToolExecutionStatus = 'SUCCESS' | 'EMPTY' | 'ERROR';
export type ToolErrorDisposition = 'retry' | 'llm' | 'summarize';
export declare function readToolInvokeMaxRetries(): number;
export { isMutationTool } from '../../../tool-engine/tool-mutation.util';
export declare function finalizeToolErrorDispositionAfterInvoke(disposition: ToolErrorDisposition): ToolErrorDisposition;
export declare function resolveToolErrorDisposition(output: unknown): ToolErrorDisposition;
export type ToolExecutionStatusContext = {
    agentMetadata?: unknown;
};
export declare function isMutationExecutionContext(context?: ToolExecutionStatusContext): boolean;
export declare function classifyToolExecutionStatus(output: unknown, context?: ToolExecutionStatusContext): ToolExecutionStatus;
export declare function resolveToolExecutionStatusAfterInvoke(rawOutput: unknown, projectedOutput: unknown, context?: ToolExecutionStatusContext): ToolExecutionStatus;
export declare function resolveToolStepMachineCode(input: {
    quality: 'high' | 'medium' | 'low';
    output: unknown;
    agentMetadata?: unknown;
}): AgentMachineCode | null;
export declare function resolveToolObservationOutputForStore(rawOutput: unknown, projectedOutput: unknown): unknown;
export declare function findLastErrorObservation<T extends {
    output: unknown;
}>(observations: T[], preferredIndices?: number[]): T | null;
export declare function userMessageHasTemporalScope(userMessage: string): boolean;
export declare function toolArgsHaveTemporalScope(args: Record<string, unknown>): boolean;
export declare function hasIncompleteToolInvocation(input: {
    userMessage: string;
    agentMetadata: unknown;
    inputSchema: unknown;
    args: Record<string, unknown>;
}): boolean;
export declare function shouldShortCircuitEmptyToSummarize(input: {
    userMessage: string;
    toolCalls: Array<{
        name: string;
        arguments: Record<string, unknown>;
    }>;
    scopedTools: Array<{
        name: string;
        agentMetadata: unknown;
        inputSchema: unknown;
    }>;
    executionStatuses: ToolExecutionStatus[];
}): boolean;
export declare function pickSummarizeErrorObservation<T extends {
    output: unknown;
}>(observations: T[], dispositions: ToolErrorDisposition[], roundObservationIndices: number[]): T | null;
export declare function shouldReturnToLlmAfterToolErrors(observations: Array<{
    output: unknown;
}>, dispositions: ToolErrorDisposition[], roundObservationIndices: number[]): boolean;
export declare function readRetryBackoffMs(attempt: number): number;
