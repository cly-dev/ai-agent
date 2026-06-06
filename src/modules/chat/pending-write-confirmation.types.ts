import type { ToolLevel } from '../../../generated/prisma/client';

export type PendingWriteToolCall = {
  name: string;
  arguments: Record<string, unknown>;
  riskLevel: ToolLevel;
  reason: string;
};

/** 可 JSON 序列化的 observation，用于确认后恢复 graph。 */
export type PendingToolObservation = {
  name: string;
  output: unknown;
  llmPayload?: unknown;
  quality?: 'high' | 'medium' | 'low';
  fieldLabels?: Record<string, string>;
  fieldDescriptions?: Record<string, string>;
  enumLabelsByPath?: Record<string, Record<string, string>>;
};

export type PendingWriteResumeContext = {
  steps: Array<{
    step: number;
    type: string;
    name?: string;
    input?: Record<string, unknown> | string;
    output?: Record<string, unknown> | string;
    meta?: Record<string, unknown>;
  }>;
  iteration: number;
  toolObservations: PendingToolObservation[];
  scopedToolIds: number[];
  intentKind: 'task' | 'smalltalk' | 'unclear';
  hasExpandedOnce: boolean;
  /** skill 命中续跑时恢复决策 prompt 与 bind 跳过标记 */
  skillApplied?: boolean;
  activeSkillId?: number | null;
  activeSkillPrompt?: string | null;
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
  resumeContext: PendingWriteResumeContext;
  createdAt: string;
};
