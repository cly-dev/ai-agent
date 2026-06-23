import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import type { Message } from '../../../generated/prisma/client';
import type { Prisma } from '../../../generated/prisma/client';
import { AgentEngineService } from '../../core/agent-engine/engine/agent-engine.service';
import {
  resolveAgentRunFailureCode,
  resolveAgentRunFailureUserMessage,
} from '../../core/agent-engine/engine/agent-run-user-messages.util';
import { LlmService } from '../../core/llm/llm.service';
import { SessionMessageContextSyncService } from '../../core/memory/context/session-message-context-sync.service';
import { PromptComposerService } from '../../core/prompt/prompt-composer.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { PaginatedResult } from '../../common/pagination';
import { ChatEventsService } from '../chat/chat-events.service';
import { ChatService } from '../chat/chat.service';
import { PendingWriteConfirmationStore } from '../chat/pending-write-confirmation.store';
import type { QueryChatListDto } from '../chat/dto/query-chat-list.dto';
import { parsePageContextFromMessageFields } from '../../core/host-bridge';
import { buildWriteConfirmActionMessagePersistence } from '../../core/agent-engine/engine/write-confirm-action-message.util';
import { SaveMessageDto } from './dto/save-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);
  /** 同一会话串行执行 Agent，避免上一轮 assistant 未入库就开始下一轮 compose。 */
  private readonly agentRunChains = new Map<string, Promise<void>>();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    private readonly chatEvents: ChatEventsService,
    private readonly pendingWriteConfirmationStore: PendingWriteConfirmationStore,
    private readonly sessionMessageContext: SessionMessageContextSyncService,
    private readonly promptComposer: PromptComposerService,
    private readonly llmService: LlmService,
    private readonly agentEngine: AgentEngineService,
  ) {}

  async create(
    userId: number,
    sessionId: string,
    dto: SaveMessageDto,
    appClientId: number,
  ): Promise<Message> {
    const session = await this.chatService.assertSessionOwnedByUser(
      sessionId,
      userId,
      appClientId,
    );
    const confirmWrite = dto.confirmWrite === true;
    const cancelWrite = dto.cancelWrite === true;
    const isWriteConfirmAction =
      dto.role === 'user' &&
      (confirmWrite || cancelWrite) &&
      !String(dto.content ?? '').trim();
    let boundSession = session;
    if (dto.role === 'user') {
      boundSession = await this.chatService.ensureSessionAgent(
        session,
        dto.agentId,
        appClientId,
      );
      if (dto.skillId != null && !confirmWrite && !cancelWrite) {
        await this.agentEngine.assertRequestedSkillRunnable({
          userId,
          appClientId,
          agentId: boundSession.agentId!,
          sessionId: boundSession.id,
          skillId: dto.skillId,
        });
      }
    }
    const pageContext = parsePageContextFromMessageFields(dto);
    let messageContent: string | null = isWriteConfirmAction
      ? null
      : this.normalizeMessageContentForStorage(dto.content);
    let messageToolName: string | null = dto.toolName ?? null;
    let messageToolInput = this.toJson(dto.toolInput);
    let messagePageContext = pageContext;
    if (isWriteConfirmAction) {
      const pending = await this.pendingWriteConfirmationStore.get(
        session.id,
        userId,
      );
      const persisted = buildWriteConfirmActionMessagePersistence({
        action: cancelWrite ? 'cancel_write' : 'confirm_write',
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
    await this.sessionMessageContext.syncAfterMessageCreate(session.id, message);
    if (message.role === 'assistant' && dto.turnId != null) {
      await this.linkAssistantOutputToTurn(
        userId,
        session.id,
        dto.turnId,
        message.id,
      );
    }
    if (message.role === 'user') {
      this.scheduleAgentRun(boundSession.id, () =>
        this.runAgentPipeline(
          userId,
          boundSession.id,
          message.content ?? '',
          message.id,
          confirmWrite && !cancelWrite,
          cancelWrite,
          dto.skillId,
          messagePageContext,
        ),
      );
    }
    return message;
  }

  async findAllBySession(
    sessionId: string,
    userId: number,
    appClientId: number,
    query: QueryChatListDto,
  ): Promise<PaginatedResult<Message>> {
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

  async composePromptAndChat(
    userId: number,
    sessionId: string,
    latestUserMessage: string,
    appClientId: number,
  ) {
    const session = await this.chatService.assertSessionOwnedByUser(
      sessionId,
      userId,
      appClientId,
    );
    const prompt = await this.promptComposer.compose({
      userId,
      sessionId: session.id,
      latestUserMessage,
    });
    return this.llmService.chat({
      messages: prompt.messages,
    });
  }

  private scheduleAgentRun(
    sessionId: string,
    task: () => Promise<void>,
  ): void {
    const previous = this.agentRunChains.get(sessionId) ?? Promise.resolve();
    const current = previous
      .catch(() => undefined)
      .then(task)
      .catch((error: unknown) => {
        this.logger.warn(
          `agent run chain failed for sessionId=${sessionId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });
    this.agentRunChains.set(sessionId, current);
    void current.finally(() => {
      if (this.agentRunChains.get(sessionId) === current) {
        this.agentRunChains.delete(sessionId);
      }
    });
  }

  private async runAgentPipeline(
    userId: number,
    sessionId: string,
    input: string,
    userMessageId?: number,
    confirmWrite?: boolean,
    cancelWrite?: boolean,
    requestedSkillId?: number,
    pageContext?: ReturnType<typeof parsePageContextFromMessageFields>,
  ): Promise<void> {
    if (cancelWrite) {
      await this.agentEngine.cancelPendingWriteConfirmation(userId, sessionId);
      return;
    }
    const content = input.trim();
    if (!content && !confirmWrite) {
      return;
    }
    try {
      const run = confirmWrite
        ? await this.agentEngine.resumeAfterWriteConfirm({
            userId,
            sessionId,
            userMessageId,
            pageContext: pageContext ?? null,
          })
        : await this.agentEngine.run({
            userId,
            sessionId,
            input: content,
            userMessageId: userMessageId!,
            requestedSkillId,
            pageContext: pageContext ?? null,
          });
      if (!run) {
        if (confirmWrite) {
          return;
        }
        this.chatEvents.emit(sessionId, {
          event: 'error',
          payload: {
            message:
              '当前会话未绑定 Agent，无法执行智能回复。请确认 agentId=1 存在且属于当前 AppClient。',
            code: 'NO_AGENT',
          },
        });
        return;
      }
    } catch (error) {
      const userMessage = resolveAgentRunFailureUserMessage(error);
      if (userMessage == null) {
        throw error;
      }
      this.logger.warn(
        `agent run failed for sessionId=${sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      this.chatEvents.emit(sessionId, {
        event: 'error',
        payload: {
          message: userMessage,
          code: resolveAgentRunFailureCode(error) ?? 'LLM_TIMEOUT',
        },
      });
    }
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

}
