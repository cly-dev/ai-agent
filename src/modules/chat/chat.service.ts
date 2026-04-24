import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { Message } from '../../../generated/prisma/client';
import type { Session } from '../../../generated/prisma/client';
import { SessionContextStore } from '../../core/memory/session-context.store';
import { PrismaService } from '../../prisma/prisma.service';
import { MessageService } from '../message/message.service';
import { ChatEventsService } from './chat-events.service';
import { CreateChatDto } from './dto/create-chat.dto';

@Injectable()
export class ChatService {
  private static readonly SESSION_ID_HEX = /^[a-f0-9]{32}$/;

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatEvents: ChatEventsService,
    private readonly sessionContextStore: SessionContextStore,
    @Inject(forwardRef(() => MessageService))
    private readonly messageService: MessageService,
  ) {}

  async create(
    userId: number,
    appClientId: number,
    dto: CreateChatDto,
  ): Promise<{ sessionId: string }> {
    if (dto.agentId != null) {
      const agent = await this.prisma.agent.findFirst({
        where: { id: dto.agentId, appClientId },
        select: { id: true },
      });
      if (!agent) {
        throw new BadRequestException(
          'agent not found or does not belong to this app client',
        );
      }
    }
    const id = this.createSessionId();
    const session = await this.prisma.session.create({
      data: {
        id,
        userId,
        appClientId,
        title: dto.content.slice(0, 20),
        agentId: dto.agentId,
      },
    });

    try {
      await this.messageService.create(userId, session.id, dto, appClientId);
    } catch (error) {
      await this.prisma.session.delete({ where: { id: session.id } });
      throw error;
    }
    return { sessionId: session.id };
  }

  async findAllForUser(
    userId: number,
    appClientId: number,
  ): Promise<
    Array<{
      sessionId: string;
      title: string | null;
      agentId: number | null;
      createdAt: Date;
    }>
  > {
    const sessions = await this.prisma.session.findMany({
      where: { userId, appClientId },
      orderBy: { createdAt: 'desc' },
    });
    return sessions.map((session) => ({
      sessionId: session.id,
      title: session.title ?? null,
      agentId: session.agentId ?? null,
      createdAt: session.createdAt,
    }));
  }

  async findOneForUser(
    sessionId: string,
    userId: number,
    appClientId: number,
  ): Promise<{
    sessionId: string;
    title: string | null;
    agentId: number | null;
    createdAt: Date;
    messages: Message[];
  }> {
    const row = await this.prisma.session.findFirst({
      where: { id: sessionId, userId, appClientId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!row) {
      throw new NotFoundException('chat not found');
    }
    return {
      sessionId: row.id,
      title: row.title ?? null,
      agentId: row.agentId ?? null,
      createdAt: row.createdAt,
      messages: row.messages,
    };
  }

  async remove(
    sessionId: string,
    userId: number,
    appClientId: number,
  ): Promise<void> {
    const session = await this.resolveSession(sessionId, userId, appClientId);
    await this.prisma.$transaction([
      this.prisma.message.deleteMany({ where: { sessionId: session.id } }),
      this.prisma.session.delete({ where: { id: session.id } }),
    ]);
    await this.clearSessionContext(session.id);
    this.chatEvents.closeSession(session.id);
  }

  /** 供 Message 等模块校验会话归属 */
  async assertSessionOwnedByUser(
    sessionId: string,
    userId: number,
    appClientId: number,
  ): Promise<Session> {
    return this.resolveSession(sessionId, userId, appClientId);
  }

  private async resolveSession(
    sessionId: string,
    userId: number,
    appClientId: number,
  ): Promise<Session> {
    const normalizedSessionId = this.normalizeSessionId(sessionId);
    const row = await this.prisma.session.findFirst({
      where: { id: normalizedSessionId, userId, appClientId },
    });
    if (!row) {
      throw new NotFoundException('chat not found');
    }
    return row;
  }

  private createSessionId(): string {
    return randomBytes(16).toString('hex');
  }

  private normalizeSessionId(sessionId: string): string {
    const value = sessionId.trim().toLowerCase();
    if (!ChatService.SESSION_ID_HEX.test(value)) {
      throw new BadRequestException(
        'sessionId must be a 32-character lowercase hex string',
      );
    }
    return value;
  }

  private async clearSessionContext(sessionId: string): Promise<void> {
    try {
      await this.sessionContextStore.delete(sessionId);
    } catch {
      // redis 不可用时不影响主流程
    }
  }
}
