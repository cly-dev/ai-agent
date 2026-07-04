import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import type { Message } from '../../../generated/prisma/client';
import type { Prisma } from '../../../generated/prisma/client';
import { AgentEngineService } from '../../core/agent-engine/engine/agent-engine.service';
import { SessionMessageContextSyncService } from '../../core/memory/context/session-message-context-sync.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatEventsService } from '../chat/chat-events.service';
import { ChatService } from '../chat/chat.service';
import { PendingWriteConfirmationStore } from '../chat/pending-write-confirmation.store';
import type { QueryChatListDto } from '../chat/dto/query-chat-list.dto';
import { parsePageContextFromMessageFields } from '../../core/host-bridge';
import { buildWriteConfirmActionMessagePersistence } from '../../core/agent-engine/engine/write-confirm-action-message.util';
import {
  draftReviewDecisionFromLegacyFlags,
  normalizeDraftReviewDecision,
} from '../../core/draft-review';
import { SessionRunCoordinator } from '../../core/session-run/session-run-coordinator.service';
import { SaveMessageDto } from './dto/save-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    private readonly chatEvents: ChatEventsService,
    private readonly pendingWriteConfirmationStore: PendingWriteConfirmationStore,
    private readonly sessionMessageContext: SessionMessageContextSyncService,
    private readonly agentEngine: AgentEngineService,
    private readonly sessionRunCoordinator: SessionRunCoordinator,
  ) {}

  async create(
    userId: number,
    sessionId: string,
    dto: SaveMessageDto,
    appClientId: number,
  ): Promise<Message & { runGeneration?: number }> {
    const session = await this.chatService.assertSessionOwnedByUser(
      sessionId,
      userId,
      appClientId,
    );
    const writeGateDecision =
      normalizeDraftReviewDecision(dto.writeGate) ??
      draftReviewDecisionFromLegacyFlags({
        confirmWrite: dto.confirmWrite === true,
        cancelWrite: dto.cancelWrite === true,
      });
    if (dto.writeGate != null && writeGateDecision == null) {
      throw new BadRequestException({
        code: 'INVALID_DRAFT_REVIEW_DECISION',
        message:
          'Invalid writeGate decision (confirm_with_edits requires edits; retry requires retryInstruction)',
      });
    }
    const isWriteGateAction =
      dto.role === 'user' &&
      writeGateDecision != null &&
      !String(dto.content ?? '').trim();
    const pageContext = parsePageContextFromMessageFields(dto);
    let boundSession = session;
    if (dto.role === 'user') {
      boundSession = await this.chatService.ensureSessionAgent(
        session,
        dto.agentId,
        appClientId,
        {
          userMessage: dto.content,
          pageContext,
        },
      );
      if (dto.skillId != null && !writeGateDecision) {
        await this.agentEngine.assertRequestedSkillRunnable({
          userId,
          appClientId,
          agentId: boundSession.agentId!,
          sessionId: boundSession.id,
          skillId: dto.skillId,
        });
      }
    }
    let messageContent: string | null = isWriteGateAction
      ? null
      : this.normalizeMessageContentForStorage(dto.content);
    let messageToolName: string | null = dto.toolName ?? null;
    let messageToolInput = this.toJson(dto.toolInput);
    let messagePageContext = pageContext;
    if (isWriteGateAction && writeGateDecision) {
      const pending = await this.pendingWriteConfirmationStore.get(
        session.id,
        userId,
      );
      const persisted = buildWriteConfirmActionMessagePersistence({
        decision: writeGateDecision,
        pending,
        incomingPageContext: pageContext,
      });
      messageContent = persisted.content;
      messageToolName = persisted.toolName;
      messageToolInput = persisted.toolInput as Prisma.InputJsonValue;
      messagePageContext = persisted.pageContext ?? pageContext;
    }
    const message = await this.prisma.message.create({
      data: {
        sessionId: session.id,
        role: dto.role,
        content: messageContent,
        toolName: messageToolName,
        toolInput: messageToolInput,
        toolOutput: this.toJson(dto.toolOutput),
        pageContextJson: messagePageContext
          ? (messagePageContext as Prisma.InputJsonValue)
          : undefined,
      },
    });
    await this.sessionMessageContext.syncAfterMessageCreate(
      session.id,
      message,
    );
    if (message.role === 'assistant' && dto.turnId != null) {
      await this.linkAssistantOutputToTurn(
        userId,
        session.id,
        dto.turnId,
        message.id,
      );
    }
    if (message.role === 'user') {
      const kind = this.resolveWriteGateJobKind(writeGateDecision);
      const policy = kind === 'chat_turn' ? 'supersede' : 'queue';
      const job = this.sessionRunCoordinator.buildJob({
        kind,
        sessionId: boundSession.id,
        userId,
        appClientId,
        userMessageId: message.id,
        input: message.content ?? '',
        requestedSkillId: dto.skillId,
        pageContext: messagePageContext,
        writeGateDecision,
      });
      const runGeneration = await this.sessionRunCoordinator.enqueue(
        job,
        policy,
      );
      return { ...message, runGeneration };
    }
    return message;
  }

  async findAllBySession(
    sessionId: string,
    userId: number,
    appClientId: number,
    query: QueryChatListDto,
  ) {
    const detail = await this.chatService.findOneForUser(
      sessionId,
      userId,
      appClientId,
      query,
    );
    return detail.messages;
  }

  async findOne(id: number, userId: number): Promise<Message> {
    const row = await this.prisma.message.findFirst({
      where: { id },
      include: { session: true },
    });
    if (!row || row.session.userId !== userId) {
      throw new NotFoundException('message not found');
    }
    return this.stripSession(row);
  }

  async update(
    id: number,
    userId: number,
    dto: UpdateMessageDto,
  ): Promise<Message> {
    const existing = await this.findOne(id, userId);
    const message = await this.prisma.message.update({
      where: { id },
      data: {
        role: dto.role,
        content:
          dto.content === undefined
            ? undefined
            : this.normalizeMessageContentForStorage(dto.content),
        toolName: dto.toolName,
        toolInput:
          dto.toolInput === undefined ? undefined : this.toJson(dto.toolInput),
        toolOutput:
          dto.toolOutput === undefined
            ? undefined
            : this.toJson(dto.toolOutput),
      },
    });
    this.chatEvents.emit(existing.sessionId, {
      event: 'message',
      payload: {
        source: 'message',
        action: 'updated',
        message,
      },
    });
    await this.sessionMessageContext.rebuildFromDb(existing.sessionId);
    return message;
  }

  async remove(id: number, userId: number): Promise<void> {
    const existing = await this.findOne(id, userId);
    await this.prisma.message.delete({ where: { id } });
    this.chatEvents.emit(existing.sessionId, {
      event: 'message',
      payload: {
        source: 'message',
        action: 'deleted',
        id,
      },
    });
    await this.sessionMessageContext.rebuildFromDb(existing.sessionId);
  }

  private async linkAssistantOutputToTurn(
    userId: number,
    sessionId: string,
    turnId: number,
    messageId: number,
  ): Promise<void> {
    const turn = await this.prisma.messageTurn.findFirst({
      where: { id: turnId, sessionId, userId },
      select: { id: true },
    });
    if (!turn) {
      throw new NotFoundException('message turn not found');
    }
    await this.prisma.messageTurn.update({
      where: { id: turnId },
      data: { outputMessageId: messageId },
    });
  }

  private toJson(
    value: Record<string, unknown> | undefined,
  ): Prisma.InputJsonValue | undefined {
    if (value === undefined) {
      return undefined;
    }
    return value as Prisma.InputJsonValue;
  }

  private normalizeMessageContentForStorage(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'string') {
      return value;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private stripSession(
    row: Message & { session: { userId: number } },
  ): Message {
    return {
      id: row.id,
      sessionId: row.sessionId,
      role: row.role,
      content: row.content,
      toolName: row.toolName,
      toolInput: row.toolInput,
      toolOutput: row.toolOutput,
      pageContextJson: row.pageContextJson,
      createdAt: row.createdAt,
    };
  }

  private resolveWriteGateJobKind(
    decision: ReturnType<typeof normalizeDraftReviewDecision>,
  ): import('../../core/session-run/session-run.types').RunJobKind {
    if (!decision) {
      return 'chat_turn';
    }
    switch (decision.action) {
      case 'cancel':
        return 'write_gate_cancel';
      case 'retry':
        return 'write_gate_retry';
      case 'confirm':
      case 'confirm_with_edits':
        return 'write_gate_confirm';
      default:
        return 'chat_turn';
    }
  }
}
