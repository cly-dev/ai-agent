import type { Prisma } from '../../../generated/prisma/client';



/** Redis `context:session:{id}` 载荷，与 MessageService 写入结构一致。 */
export type SessionContextTurn = {
  messageId: number;
  role: string;
  content: string | null;
  toolName: string | null;
  toolInput: Prisma.JsonValue | null;
  toolOutput: Prisma.JsonValue | null;
  createdAt: string;
};
export type WorkingMemoryFact = {
  key: string;
  value: string;
};

/** 会话级工作记忆（Redis SessionContextPayload.workingMemory）。 */
export type WorkingMemoryState = {
  goal?: string;
  facts: WorkingMemoryFact[];
  entities: Record<string, unknown>;
  pendingActions?: string[];
  lastToolSummary?: string;
  updatedAt: string;
};

export type WorkingMemoryUpdateContext = {
  userInput: string;
  finalOutput: string;
  toolObservations: Array<{ name: string; output: unknown }>;
};

export type SessionContextPayload = {
  sessionId: string;
  turns: SessionContextTurn[];
  workingMemory?: WorkingMemoryState;
  /** 较早轮次的 LLM 压缩摘要（对应 messageId <= compressedUpToMessageId）。 */
  compressedHistorySummary?: string;
  /** 已纳入摘要的最后一条 messageId。 */
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
