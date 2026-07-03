import type { ToolLevel } from '../../../generated/prisma/client';
import type { MessageBlock } from '../agent-engine/engine/message/message-blocks.types';

/** 挂起期间写草稿的生命周期事件。 */
export type WriteDraftLastEvent =
  | 'composed'
  | 'suspended'
  | 'user_edit'
  | 'retry';

/**
 * 写操作草稿 — Chat / PageAction 共用机器层真值。
 * HTTP 写操作仅认 `arguments`；`presentation` 为可重建视图。
 */
export type WriteDraft = {
  /** 草稿协议版本（结构变更时递增）。 */
  schemaVersion: 1;
  /** 乐观锁：compose / edit / retry 每次变更 +1。 */
  version: number;
  tool: {
    name: string;
    toolId?: number;
    riskLevel: ToolLevel | string;
  };
  /** 执行真值：LLM compose + 机器补齐 + 用户 edit merge。 */
  arguments: Record<string, unknown>;
  presentation: {
    summaryText?: string | null;
    previewBlocks: MessageBlock[];
  };
  provenance: {
    draftRetryCount: number;
    composedAt: string;
    lastEvent: WriteDraftLastEvent;
  };
};

/** C 端 / SSE 对外暴露的 writeDraft（不含 resume bundle）。 */
export type WriteDraftPublic = {
  version: number;
  tool: {
    name: string;
    toolId?: number;
    riskLevel: string;
  };
  arguments: Record<string, unknown>;
  presentation: {
    summaryText?: string | null;
    previewBlocks: MessageBlock[];
  };
  provenance: {
    draftRetryCount: number;
    draftRetryMax: number;
    canRetry: boolean;
    composedAt: string;
    lastEvent: WriteDraftLastEvent;
  };
};

export type BuildPageWriteDraftInput = {
  tool: {
    name: string;
    toolId?: number;
    riskLevel: ToolLevel | string;
    arguments: Record<string, unknown>;
  };
  summaryText?: string | null;
  fillText?: string;
  draftRetryCount?: number;
  version?: number;
  lastEvent?: WriteDraftLastEvent;
  composedAt?: string;
};
