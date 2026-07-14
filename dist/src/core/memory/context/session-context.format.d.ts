import type { Prisma } from '../../../../generated/prisma/client';
import type { LlmChatMessage } from '../../llm/llm.types';
import type { SessionContextTurn } from './session-context.types';
export declare function formatMessageTurnBody(turn: SessionContextTurn): string;
export declare function messageTurnsToLlmMessages(turns: SessionContextTurn[], maxMessages: number): LlmChatMessage[];
export declare function dbMessageRowToMessageTurn(row: {
    id: number;
    role: string;
    content: string | null;
    toolName: string | null;
    toolInput: Prisma.JsonValue | null;
    toolOutput: Prisma.JsonValue | null;
    createdAt: Date;
}): SessionContextTurn;
