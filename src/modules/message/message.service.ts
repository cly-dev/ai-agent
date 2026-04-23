import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import type { Message } from '../../../generated/prisma/client';
import type { Prisma } from '../../../generated/prisma/client';
import { LlmService } from '../../core/llm/llm.service';
import { SessionContextStore } from '../../core/memory/session-context.store';
import { PromptComposerService } from '../../core/prompt/prompt-composer.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatEventsService } from '../chat/chat-events.service';
import { ChatService } from '../chat/chat.service';
import { SaveMessageDto } from './dto/save-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

type SessionContextTurn = {
  messageId: number;
  role: string;
  content: string | null;
  toolName: string | null;
  toolInput: Prisma.JsonValue | null;
  toolOutput: Prisma.JsonValue | null;
  createdAt: string;
};

type SessionContextPayload = {
  sessionId: string;
  turns: SessionContextTurn[];
  updatedAt: string;
};

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    private readonly chatEvents: ChatEventsService,
    private readonly sessionContextStore: SessionContextStore,
    private readonly promptComposer: PromptComposerService,
    private readonly llmService: LlmService,
  ) {}

  async create(
    userId: number,
    sessionId: string,
    dto: SaveMessageDto,
  ): Promise<Message> {
    const session = await this.chatService.assertSessionOwnedByUser(
      sessionId,
      userId,
    );
    const message = await this.prisma.message.create({
      data: {
        sessionId: session.id,
        role: dto.role,
        content: dto.content ?? null,
        toolName: dto.toolName ?? null,
        toolInput: this.toJson(dto.toolInput),
        toolOutput: this.toJson(dto.toolOutput),
      },
    });
    await this.syncSessionContextAfterCreate(session.id, message);


    if (message.role === 'user') {
      this.chatEvents.emit(session.id, {
        event: 'result',
        payload: {
          content: JSON.stringify({
            source: 'message',
            action: 'created',
            message,
          }),
        },
      });
    }
    return message;
  }

  async findAllBySession(
    sessionId: string,
    userId: number,
  ): Promise<Message[]> {
    const session = await this.chatService.assertSessionOwnedByUser(
      sessionId,
      userId,
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
        content: dto.content,
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
      event: 'result',
      payload: {
        content: JSON.stringify({
          source: 'message',
          action: 'updated',
          message,
        }),
      },
    });
    await this.rebuildSessionContextFromDb(existing.sessionId);
    return message;
  }

  async remove(id: number, userId: number): Promise<void> {
    const existing = await this.findOne(id, userId);
    await this.prisma.message.delete({ where: { id } });
    this.chatEvents.emit(existing.sessionId, {
      event: 'result',
      payload: {
        content: JSON.stringify({
          source: 'message',
          action: 'deleted',
          id,
        }),
      },
    });
    await this.rebuildSessionContextFromDb(existing.sessionId);
  }

  async composePromptAndChat(
    userId: number,
    sessionId: string,
    latestUserMessage: string,
  ) {
    const session = await this.chatService.assertSessionOwnedByUser(
      sessionId,
      userId,
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

  private toJson(
    value: Record<string, unknown> | undefined,
  ): Prisma.InputJsonValue | undefined {
    if (value === undefined) {
      return undefined;
    }
    return value as Prisma.InputJsonValue;
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

  private toSessionTurn(message: Message): SessionContextTurn {
    return {
      messageId: message.id,
      role: message.role,
      content: message.content ?? null,
      toolName: message.toolName ?? null,
      toolInput: (message.toolInput as Prisma.JsonValue | null) ?? null,
      toolOutput: (message.toolOutput as Prisma.JsonValue | null) ?? null,
      createdAt: message.createdAt.toISOString(),
    };
  }

  private isSessionContextPayload(
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

  private async syncSessionContextAfterCreate(
    sessionId: string,
    message: Message,
  ): Promise<void> {
    try {
      const current = await this.sessionContextStore.get(sessionId);
      if (!current) {
        await this.rebuildSessionContextFromDb(sessionId);
        return;
      }
      if (!this.isSessionContextPayload(current)) {
        await this.rebuildSessionContextFromDb(sessionId);
        return;
      }
      const next: SessionContextPayload = {
        ...current,
        sessionId,
        turns: [...current.turns, this.toSessionTurn(message)],
        updatedAt: new Date().toISOString(),
      };
      await this.sessionContextStore.set(sessionId, next);
    } catch (error) {
      this.logger.warn(
        `failed to sync redis session context for sessionId=${sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async rebuildSessionContextFromDb(sessionId: string): Promise<void> {
    try {
      const rows = await this.prisma.message.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
      });
      const payload: SessionContextPayload = {
        sessionId,
        turns: rows.map((row) => this.toSessionTurn(row)),
        updatedAt: new Date().toISOString(),
      };
      await this.sessionContextStore.set(sessionId, payload);
    } catch (error) {
      this.logger.warn(
        `failed to rebuild redis session context for sessionId=${sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
