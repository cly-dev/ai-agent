import { Injectable, Logger } from '@nestjs/common';
import {
  messageBlocksToPlainText,
  sanitizeMessageBlocks,
  sanitizeStoredFinalOutput,
  serializeMessageBlocksForStorage,
  tryParseStoredMessageBlocks,
} from '../message/message-blocks.util';
import type { MessageBlock } from '../message/message-blocks.types';

/** 本轮用户可见回复定稿阶段。 */
export type RunAssistantArtifactPhase = 'draft' | 'final';

/** 单轮 AgentRun 的用户可见回复权威产物（SSE full 与落库均以此为准）。 */
export type RunAssistantArtifact = {
  runId: number;
  turnId: number;
  blocks: MessageBlock[];
  serialized: string;
  phase: RunAssistantArtifactPhase;
};

type RunAssistantArtifactSlot = {
  turnId: number;
  artifact: RunAssistantArtifact | null;
};

/**
 * 每轮 run 一个权威 assistant 产物槽。
 * summarize 定稿写入；complete 时 peek 落库；run 结束时 clear。
 */
@Injectable()
export class RunAssistantArtifactStore {
  private readonly logger = new Logger(RunAssistantArtifactStore.name);
  private readonly slots = new Map<string, RunAssistantArtifactSlot>();

  runKey(sessionId: string, runId: number): string {
    return `${sessionId}:${runId}`;
  }

  reset(sessionId: string, runId: number, turnId: number): void {
    this.slots.set(this.runKey(sessionId, runId), { turnId, artifact: null });
  }

  clear(sessionId: string, runId: number): void {
    this.slots.delete(this.runKey(sessionId, runId));
  }

  commit(
    sessionId: string,
    runId: number,
    blocks: MessageBlock[],
    phase: RunAssistantArtifactPhase = 'final',
  ): RunAssistantArtifact | null {
    const slot = this.slots.get(this.runKey(sessionId, runId));
    if (!slot) {
      this.logger.warn(
        `artifact commit skipped: slot missing sessionId=${sessionId} runId=${runId}`,
      );
      return null;
    }
    const sanitized = sanitizeMessageBlocks(blocks);
    if (sanitized.length === 0) {
      return null;
    }
    const artifact: RunAssistantArtifact = {
      runId,
      turnId: slot.turnId,
      blocks: sanitized,
      serialized: serializeMessageBlocksForStorage(sanitized),
      phase,
    };
    slot.artifact = artifact;
    return artifact;
  }

  peek(sessionId: string, runId: number): RunAssistantArtifact | null {
    return this.slots.get(this.runKey(sessionId, runId))?.artifact ?? null;
  }

  peekSerialized(sessionId: string, runId: number): string | null {
    const serialized = this.peek(sessionId, runId)?.serialized;
    return serialized && serialized.trim().length > 0 ? serialized : null;
  }

  peekBlocks(sessionId: string, runId: number): MessageBlock[] {
    return this.peek(sessionId, runId)?.blocks ?? [];
  }

  peekTurnId(sessionId: string, runId: number): number | null {
    return this.slots.get(this.runKey(sessionId, runId))?.turnId ?? null;
  }

  /**
   * 本 run 的 assistant 产物是否应落库到 turn 消息槽。
   * draft / final 均入库，与 SSE stream full 一致（写确认前预览、gate 说明等）。
   */
  isPersistableAssistantArtifact(
    sessionId: string,
    runId: number,
  ): boolean {
    const artifact = this.peek(sessionId, runId);
    return Boolean(artifact?.serialized.trim());
  }

  /** 在现有 artifact 末尾追加用户可见 blocks（如写确认提示）。 */
  appendBlocks(
    sessionId: string,
    runId: number,
    blocks: MessageBlock[],
  ): RunAssistantArtifact | null {
    const extra = sanitizeMessageBlocks(blocks);
    if (extra.length === 0) {
      return this.peek(sessionId, runId);
    }
    const current = this.peek(sessionId, runId);
    const merged = sanitizeMessageBlocks([...(current?.blocks ?? []), ...extra]);
    if (merged.length === 0) {
      return null;
    }
    return this.commit(
      sessionId,
      runId,
      merged,
      current?.phase ?? 'draft',
    );
  }

  /** @deprecated 使用 isPersistableAssistantArtifact */
  shouldPersistAtFinish(sessionId: string, runId: number): boolean {
    return this.isPersistableAssistantArtifact(sessionId, runId);
  }

  /**
   * 从 artifact 解析落库串与 step plain（SSE / Message / AgentRunStep 同源）。
   * fallbackSerialized 仅在没有 artifact 时使用（不应出现在正常 summarize 定稿路径）。
   */
  formatOutput(
    sessionId: string,
    runId: number,
    fallbackSerialized: string,
  ): { serialized: string; stepPlain: string } {
    const artifact = this.peek(sessionId, runId);
    if (artifact?.blocks.length) {
      return {
        serialized: artifact.serialized,
        stepPlain: messageBlocksToPlainText(artifact.blocks),
      };
    }
    const serialized = sanitizeStoredFinalOutput(fallbackSerialized);
    const blocks = tryParseStoredMessageBlocks(serialized);
    return {
      serialized,
      stepPlain:
        blocks && blocks.length > 0
          ? messageBlocksToPlainText(blocks)
          : serialized,
    };
  }

  /** 仅更新阶段标记（blocks 不变），用于 plan 中间 draft 步。 */
  rephase(
    sessionId: string,
    runId: number,
    phase: RunAssistantArtifactPhase,
  ): void {
    const current = this.peek(sessionId, runId);
    if (!current) {
      return;
    }
    this.commit(sessionId, runId, current.blocks, phase);
  }
}
