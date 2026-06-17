import { Injectable, NotFoundException } from '@nestjs/common';
import type { Message } from '../../../../../generated/prisma/client';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { SessionMessageContextSyncService } from '../../../memory/context/session-message-context-sync.service';
import {
  sanitizeMessageBlocks,
  serializeMessageBlocksForStorage,
  textBlock,
  tryParseStoredMessageBlocks,
} from '../message/message-blocks.util';
import { RunAssistantArtifactStore } from './run-assistant-artifact.store';
import {
  emitAgentMessagePersistDebug,
  logPersistContentMismatch,
  serializedSourceSnapshot,
} from '../message/message-blocks-debug.util';

type PrismaTx = Prisma.TransactionClient;

@Injectable()
export class RunAssistantMessagePersistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assistantArtifact: RunAssistantArtifactStore,
    private readonly sessionMessageContext: SessionMessageContextSyncService,
  ) {}

  /**
   * 将 artifact 写入 turn 唯一的 assistant 消息槽（MessageTurn.outputMessageId）。
   * 同一 turn 内 primary 草稿不占槽；worker 终稿 create 或覆盖该槽。
   */
  async persistFromArtifactInTx(
    tx: PrismaTx,
    input: {
      userId: number;
      sessionId: string;
      runId: number;
      turnId: number;
    },
  ): Promise<{ message: Message | null; replacedTurnOutput: boolean }> {
    if (
      !this.assistantArtifact.isPersistableAssistantArtifact(
        input.sessionId,
        input.runId,
      )
    ) {
      return { message: null, replacedTurnOutput: false };
    }

    const artifact = this.assistantArtifact.peek(input.sessionId, input.runId);
    if (!artifact?.serialized.trim()) {
      return { message: null, replacedTurnOutput: false };
    }

    const existingRun = await tx.agentRun.findFirst({
      where: {
        id: input.runId,
        sessionId: input.sessionId,
        turnId: input.turnId,
      },
      select: { outputMessageId: true },
    });
    if (!existingRun) {
      throw new NotFoundException('agent run not found');
    }
    if (existingRun.outputMessageId != null) {
      const message = await tx.message.findUnique({
        where: { id: existingRun.outputMessageId },
      });
      logPersistContentMismatch({
        sessionId: input.sessionId,
        runId: input.runId,
        turnId: input.turnId,
        tag: 'PERSIST_RUN_ALREADY_LINKED',
        artifactSerialized: artifact.serialized,
        priorDbContent: message?.content ?? '',
      });
      return { message, replacedTurnOutput: false };
    }

    const session = await tx.session.findFirst({
      where: { id: input.sessionId, userId: input.userId },
      select: { id: true },
    });
    if (!session) {
      throw new NotFoundException('chat not found');
    }

    const turn = await tx.messageTurn.findFirst({
      where: {
        id: artifact.turnId,
        sessionId: session.id,
        userId: input.userId,
      },
      select: { id: true, outputMessageId: true },
    });
    if (!turn) {
      throw new NotFoundException('message turn not found');
    }

    if (turn.outputMessageId != null) {
      const existing = await tx.message.findUnique({
        where: { id: turn.outputMessageId },
      });
      logPersistContentMismatch({
        sessionId: input.sessionId,
        runId: input.runId,
        turnId: input.turnId,
        tag: 'PERSIST_TURN_UPDATE',
        artifactSerialized: artifact.serialized,
        priorDbContent: existing?.content ?? '',
      });
      const message = await tx.message.update({
        where: { id: turn.outputMessageId },
        data: { content: artifact.serialized },
      });
      emitAgentMessagePersistDebug({
        tag: 'PERSIST_UPDATE',
        sessionId: input.sessionId,
        runId: input.runId,
        turnId: input.turnId,
        messageId: message.id,
        dbContent: message.content,
        source: serializedSourceSnapshot(artifact.serialized, {
          label: 'artifact',
          blocks: artifact.blocks,
        }),
      });
      await tx.agentRun.update({
        where: { id: input.runId },
        data: { outputMessageId: message.id },
      });
      return { message, replacedTurnOutput: true };
    }

    const message = await tx.message.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: artifact.serialized,
      },
    });

    emitAgentMessagePersistDebug({
      tag: 'PERSIST_CREATE',
      sessionId: input.sessionId,
      runId: input.runId,
      turnId: input.turnId,
      messageId: message.id,
      dbContent: message.content,
      source: serializedSourceSnapshot(artifact.serialized, {
        label: 'artifact',
        blocks: artifact.blocks,
      }),
    });

    await tx.agentRun.update({
      where: { id: input.runId },
      data: { outputMessageId: message.id },
    });
    await tx.messageTurn.update({
      where: { id: turn.id },
      data: { outputMessageId: message.id },
    });

    return { message, replacedTurnOutput: false };
  }

  /**
   * 将 SSE 已展示、但不在 artifact 槽内的说明（如取消写确认）追加到 turn 输出消息。
   */
  async appendNoticeToTurnOutput(input: {
    userId: number;
    sessionId: string;
    turnId: number;
    noticeMarkdown: string;
  }): Promise<Message | null> {
    const trimmed = input.noticeMarkdown.trim();
    if (!trimmed) {
      return null;
    }
    const noticeBlock = textBlock(trimmed, 'markdown');

    const session = await this.prisma.session.findFirst({
      where: { id: input.sessionId, userId: input.userId },
      select: { id: true },
    });
    if (!session) {
      return null;
    }

    const turn = await this.prisma.messageTurn.findFirst({
      where: {
        id: input.turnId,
        sessionId: session.id,
        userId: input.userId,
      },
      select: { id: true, outputMessageId: true },
    });
    if (!turn) {
      return null;
    }

    let message: Message;
    let replacedTurnOutput = false;

    if (turn.outputMessageId != null) {
      const existing = await this.prisma.message.findUnique({
        where: { id: turn.outputMessageId },
      });
      if (!existing) {
        return null;
      }
      const priorBlocks =
        tryParseStoredMessageBlocks(existing.content ?? '') ??
        (existing.content?.trim()
          ? [textBlock(existing.content.trim(), 'markdown')]
          : []);
      const merged = sanitizeMessageBlocks([...priorBlocks, noticeBlock]);
      const serialized = serializeMessageBlocksForStorage(merged);
      message = await this.prisma.message.update({
        where: { id: existing.id },
        data: { content: serialized },
      });
      replacedTurnOutput = true;
      emitAgentMessagePersistDebug({
        tag: 'PERSIST_APPEND_NOTICE',
        sessionId: input.sessionId,
        runId: 0,
        turnId: input.turnId,
        messageId: message.id,
        dbContent: message.content,
        source: {
          priorContent: existing.content,
          noticeMarkdown: trimmed,
          mergedBlocks: merged,
        },
      });
    } else {
      const serialized = serializeMessageBlocksForStorage([noticeBlock]);
      message = await this.prisma.message.create({
        data: {
          sessionId: session.id,
          role: 'assistant',
          content: serialized,
        },
      });
      await this.prisma.messageTurn.update({
        where: { id: turn.id },
        data: { outputMessageId: message.id, finalOutput: serialized },
      });
      emitAgentMessagePersistDebug({
        tag: 'PERSIST_CREATE_NOTICE',
        sessionId: input.sessionId,
        runId: 0,
        turnId: input.turnId,
        messageId: message.id,
        dbContent: message.content,
        source: { noticeMarkdown: trimmed },
      });
    }

    await this.syncPersistedMessage(input.sessionId, message, {
      replacedTurnOutput,
    });
    return message;
  }

  /** 事务提交后同步 Redis 会话上下文（不可放入 DB 事务）。 */
  async syncPersistedMessage(
    sessionId: string,
    message: Message,
    options?: { replacedTurnOutput?: boolean },
  ): Promise<void> {
    if (options?.replacedTurnOutput) {
      await this.sessionMessageContext.syncAfterMessageContentUpdate(
        sessionId,
        message,
      );
      return;
    }
    await this.sessionMessageContext.syncAfterMessageCreate(sessionId, message);
  }
}
