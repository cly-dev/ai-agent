import type { Prisma } from '../../../../generated/prisma/client';

/** Redis `context:session:{id}` — 仅对话轮次与历史压缩（GOA 已迁至 DB）。 */
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

export function isSessionContextPayload(
  value: Record<string, unknown>,
): value is SessionContextPayload {
  const turns = value.turns;
  if (!Array.isArray(turns)) {
    return false;
  }
  return turns.every((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return false;
    }
    const row = item as Record<string, unknown>;
    return (
      typeof row.messageId === 'number' &&
      typeof row.role === 'string' &&
      typeof row.createdAt === 'string'
    );
  });
}
