import type { ToolLevel } from '../../../../generated/prisma/client';
export type WriteConfirmationToolCall = {
    name: string;
    arguments: Record<string, unknown>;
    riskLevel: ToolLevel;
    reason: string;
};
export type ToolLikeForWriteGate = {
    name: string;
    riskLevel: ToolLevel;
    agentMetadata: unknown;
};
export declare function collectWriteConfirmationRequired(pendingToolCalls: Array<{
    name: string;
    arguments: Record<string, unknown>;
}>, scopedTools: ToolLikeForWriteGate[]): WriteConfirmationToolCall[];
export declare function filterSchemaValidWriteConfirmationCalls(calls: WriteConfirmationToolCall[], scopedTools: ToolLikeForWriteGate[]): WriteConfirmationToolCall[];
export declare function buildWriteConfirmationUserMessage(): string;
export declare function partitionToolCallsByWriteConfirmation(pendingToolCalls: Array<{
    name: string;
    arguments: Record<string, unknown>;
}>, scopedTools: ToolLikeForWriteGate[], approvedWriteToolNames?: Iterable<string>): {
    safeCalls: Array<{
        name: string;
        arguments: Record<string, unknown>;
    }>;
    writeCallsNeedingConfirm: WriteConfirmationToolCall[];
};
