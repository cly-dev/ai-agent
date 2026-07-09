import type { WriteDraft } from '../draft-review/write-draft.types';
import type { ToolExecutionResult } from '../tool-engine/tool-engine.types';
export declare function summarizeTextForAudit(text: string | null | undefined, maxChars?: number): string | null;
export declare function summarizePromptMessagesForAudit(messages: Array<{
    role: string;
    content: string;
}>, options?: {
    maxMessages?: number;
    maxCharsPerMessage?: number;
}): Array<{
    role: string;
    content: string;
    contentLength: number;
}>;
export declare function summarizeToolCallForAudit(input: {
    name: string;
    arguments: Record<string, unknown>;
}): Record<string, unknown>;
export declare function buildLlmStepAudit(input: {
    promptMessages: Array<{
        role: string;
        content: string;
    }>;
    objectivePrefix?: string | null;
    nodeObjective?: string | null;
    systemPrompt?: string | null;
    fittedMessageCount?: number;
}): Record<string, unknown>;
export declare function buildLlmOutputStepAudit(input: {
    assistantText?: string | null;
    userFacingText?: string | null;
    toolCall?: {
        name: string;
        arguments: Record<string, unknown>;
    } | null;
    structuredOutput?: Record<string, unknown> | null;
}): Record<string, unknown>;
export declare function summarizeUnknownForAudit(value: unknown): unknown;
export declare function buildToolCallRequestAudit(input: {
    toolName: string;
    toolId?: number | null;
    arguments: Record<string, unknown>;
    httpMethod?: string | null;
    httpPath?: string | null;
}): Record<string, unknown>;
export declare function buildToolCallResultAudit(result: Pick<ToolExecutionResult, 'toolId' | 'name' | 'output' | 'latency' | 'httpResponse'>): Record<string, unknown>;
export declare function buildToolCallErrorAudit(input: {
    toolName: string;
    toolId?: number | null;
    arguments?: Record<string, unknown>;
    error: string;
}): Record<string, unknown>;
export declare function summarizeRecordForAudit(value: Record<string, unknown>, options?: {
    maxKeys?: number;
    stringPreviewChars?: number;
}): Record<string, unknown>;
export declare function buildWriteDraftStepDetail(draft: Pick<WriteDraft, 'version' | 'tool' | 'arguments' | 'presentation' | 'provenance'>): Record<string, unknown>;
export declare function buildWorkflowNodeCompleteAudit(action: string, nodeOutput: unknown): Record<string, unknown>;
