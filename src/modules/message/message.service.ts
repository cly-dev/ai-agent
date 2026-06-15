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
import { LlmService } from '../../core/llm/llm.service';
import { SessionMessageContextSyncService } from '../../core/memory/context/session-message-context-sync.service';
import { PromptComposerService } from '../../core/prompt/prompt-composer.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatEventsService } from '../chat/chat-events.service';
import { ChatService } from '../chat/chat.service';
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
    const message = await this.prisma.message.create({
      data: {
        sessionId: session.id,
        role: dto.role,
        content: isWriteConfirmAction
          ? null
          : this.normalizeMessageContentForStorage(dto.content),
        toolName: isWriteConfirmAction
          ? cancelWrite
            ? '__cancel_write__'
            : '__confirm_write__'
          : (dto.toolName ?? null),
        toolInput: this.toJson(dto.toolInput),
        toolOutput: this.toJson(dto.toolOutput),
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
      const boundSession = await this.chatService.ensureSessionAgent(
        session,
        dto.agentId,
        appClientId,
      );
      this.scheduleAgentRun(boundSession.id, () =>
        this.runAgentPipeline(
          userId,
          boundSession.id,
          message.content ?? '',
          message.id,
          confirmWrite && !cancelWrite,
          cancelWrite,
        ),
      );
    }
    return message;
  }

  async findAllBySession(
    sessionId: string,
    userId: number,
    appClientId: number,
  ): Promise<Message[]> {
    const session = await this.chatService.assertSessionOwnedByUser(
      sessionId,
      userId,
      appClientId,
    );
    return this.prisma.message.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
    });
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
          })
        : await this.agentEngine.run({
            userId,
            sessionId,
            input: content,
            userMessageId: userMessageId!,
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
      this.logger.warn(
        `agent run failed for sessionId=${sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      this.chatEvents.emit(sessionId, {
        event: 'error',
        payload: {
          message: '处理你的请求时遇到问题，请稍后重试；若持续失败请联系管理员。',
          code: 'LLM_TIMEOUT',
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
      createdAt: row.createdAt,
    };
  }

}
