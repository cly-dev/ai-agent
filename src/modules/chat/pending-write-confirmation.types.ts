import type { ToolLevel } from '../../../generated/prisma/client';

export type PendingWriteToolCall = {
  name: string;
  arguments: Record<string, unknown>;
  riskLevel: ToolLevel;
  reason: string;
};

export type PendingWriteConfirmationSnapshot = {
  runId: number;
  turnId: number;
  sessionId: string;
  userId: number;
  appClientId: number;
  agentId: number;
  latestUserMessage: string;
  toolCalls: PendingWriteToolCall[];
  createdAt: string;
};
