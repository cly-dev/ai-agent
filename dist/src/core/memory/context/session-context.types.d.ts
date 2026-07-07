import type { Prisma } from '../../../../generated/prisma/client';
export type SessionContextTurn = {
    messageId: number;
    role: string;
    content: string | null;
    toolName: string | null;
    toolInput: Prisma.JsonValue | null;
    toolOutput: Prisma.JsonValue | null;
    createdAt: string;
};
export type SessionContextPayload = {
    sessionId: string;
    turns: SessionContextTurn[];
    compressedHistorySummary?: string;
    compressedUpToMessageId?: number;
    updatedAt: string;
};
export declare function isSessionContextPayload(value: Record<string, unknown>): value is SessionContextPayload;
