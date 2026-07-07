import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { resolvePagination, toPaginatedResult } from '../../common/pagination';
import type { PaginatedResult } from '../../common/pagination';
import type { Message } from '../../../generated/prisma/client';
import type { Session } from '../../../generated/prisma/client';
import { SessionContextStore } from '../../core/memory/context/session-context.store';
import { SessionGoaStore } from '../../core/memory/goa/session-goa.store';
import { PrismaService } from '../../prisma/prisma.service';
import { MessageService } from '../message/message.service';
import { ChatEventsService } from './chat-events.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { QueryChatListDto } from './dto/query-chat-list.dto';
import { DeleteChatResponseDto } from './dto/delete-chat-response.dto';
import { SessionPrepareService } from './session-prepare.service';
import { SessionPrepareStore } from './session-prepare.store';
import { RuntimeCacheInvalidator } from '../../core/runtime-cache/runtime-cache-invalidator.service';
import { SessionRunCoordinator } from '../../core/session-run/session-run-coordinator.service';
import type { CancelSessionRunResult } from '../../core/session-run/session-run.types';
import { PendingWriteConfirmationStore } from './pending-write-confirmation.store';
import { buildPendingWriteGatePublicState } from './chat-pending-write-gate.mapper';
import { loadWriteToolsForPolicy } from '../../core/draft-review/load-write-tools-for-policy.util';
import { parsePageContextFromMessageFields } from '../../core/host-bridge';
import { AgentAutoSelectService } from './agent-auto-select.service';
import type { AgentChatPageContext } from '../../core/host-bridge';

@Injectable()
export class ChatService {
  private static readonly SESSION_ID_HEX = /^[a-f0-9]{32}$/;

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatEvents: ChatEventsService,
    private readonly sessionContextStore: SessionContextStore,
    private readonly sessionGoaStore: SessionGoaStore,
    private readonly sessionPrepareStore: SessionPrepareStore,
    private readonly sessionPrepareService: SessionPrepareService,
    private readonly runtimeCacheInvalidator: RuntimeCacheInvalidator,
    @Inject(forwardRef(() => MessageService))
    private readonly messageService: MessageService,
    private readonly sessionRunCoordinator: SessionRunCoordinator,
    private readonly pendingWriteConfirmationStore: PendingWriteConfirmationStore,
    private readonly agentAutoSelect: AgentAutoSelectService,
  ) {}

  async cancelSessionRun(
    sessionId: string,
    userId: number,
    appClientId: number,
    runId?: number,
  ): Promise<CancelSessionRunResult> {
    await this.assertSessionOwnedByUser(sessionId, userId, appClientId);
    return this.sessionRunCoordinator.cancelRun(sessionId, userId, runId);
  }

  async getSessionRunState(
    sessionId: string,
    userId: number,
    appClientId: number,
  ) {
    await this.assertSessionOwnedByUser(sessionId, userId, appClientId);
    const [runState, pending] = await Promise.all([
      this.sessionRunCoordinator.getRunState(sessionId),
      this.pendingWriteConfirmationStore.get(sessionId, userId),
    ]);
    const writeToolsById = pending
      ? await loadWriteToolsForPolicy(
          this.prisma,
          pending.resumeContext.scopedToolIds,
        )
      : undefined;
    return {
      ...runState,
      pendingWriteGate: pending
        ? buildPendingWriteGatePublicState(pending, writeToolsById)
        : null,
    };
  }

  async create(
    userId: number,
    appClientId: number,
    dto: CreateChatDto,
  ): Promise<{
    sessionId: string;
    agent: { id: number; source: string; reason: string };
  }> {
    const pageContext = parsePageContextFromMessageFields(dto);
    const selection = await this.resolveAgentSelection({
      requestedAgentId: dto.agentId,
      sessionAgentId: null,
      userId,
      appClientId,
      userMessage: dto.content,
      pageContext,
    });
    const id = this.createSessionId();
    const session = await this.prisma.session.create({
      data: {
        id,
        userId,
        appClientId,
        title: dto.content.slice(0, 20),
        agentId: selection.agentId,
      },
    });

    try {
      await this.sessionPrepareService.warm(
        session.id,
        userId,
        appClientId,
        pageContext,
      );
      await this.messageService.create(userId, session.id, dto, appClientId);
    } catch (error) {
      await this.prisma.session.delete({ where: { id: session.id } });
      await this.sessionPrepareStore.delete(session.id);
      throw error;
    }
    return {
      sessionId: session.id,
      agent: {
        id: selection.agentId,
        source: selection.source,
        reason: selection.reason,
      },
    };
  }

  async findAllForUser(
    userId: number,
    appClientId: number,
    query: QueryChatListDto,
  ): Promise<
    PaginatedResult<{
      sessionId: string;
      title: string | null;
      agentId: number | null;
      createdAt: Date;
    }>
  > {
    const { page, pageSize, skip, take } = resolvePagination(
      query.page,
      query.size,
    );
    const where = { userId, appClientId };
    const [sessions, total] = await this.prisma.$transaction([
      this.prisma.session.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          title: true,
          agentId: true,
          createdAt: true,
        },
      }),
      this.prisma.session.count({ where }),
    ]);
    return toPaginatedResult(
      sessions.map((session) => ({
        sessionId: session.id,
        title: session.title ?? null,
        agentId: session.agentId ?? null,
        createdAt: session.createdAt,
      })),
      total,
      page,
      pageSize,
    );
  }

  async findOneForUser(
    sessionId: string,
    userId: number,
    appClientId: number,
    query: QueryChatListDto,
  ): Promise<{
    sessionId: string;
    title: string | null;
    agentId: number | null;
    createdAt: Date;
    messages: PaginatedResult<Message>;
  }> {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId, appClientId },
      select: {
        id: true,
        title: true,
        agentId: true,
        createdAt: true,
      },
    });
    if (!session) {
      throw new NotFoundException('chat not found');
    }
    const { page, pageSize, skip, take } = resolvePagination(
      query.page,
      query.size,
    );
    const messageWhere = { sessionId: session.id };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        where: messageWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.message.count({ where: messageWhere }),
    ]);
    return {
      sessionId: session.id,
      title: session.title ?? null,
      agentId: session.agentId ?? null,
      createdAt: session.createdAt,
      messages: toPaginatedResult([...rows].reverse(), total, page, pageSize),
    };
  }

  async remove(
    sessionId: string,
    userId: number,
    appClientId: number,
  ): Promise<DeleteChatResponseDto> {
    const session = await this.resolveSession(sessionId, userId, appClientId);
    await this.prisma.$transaction([
      this.prisma.message.deleteMany({ where: { sessionId: session.id } }),
      this.prisma.session.delete({ where: { id: session.id } }),
    ]);
    await this.clearSessionContext(session.id);
    await this.sessionRunCoordinator.evictSession(session.id);
    this.runtimeCacheInvalidator.invalidateForSession(session.id);
    await this.sessionPrepareStore.delete(session.id);
    this.chatEvents.emit(session.id, {
      event: 'complete',
      payload: { reason: 'session_deleted', sessionId: session.id },
    });
    this.chatEvents.closeSession(session.id);
    return { sessionId: session.id };
  }

  /** 供 Message 等模块校验会话归属 */
  async assertSessionOwnedByUser(
    sessionId: string,
    userId: number,
    appClientId: number,
  ): Promise<Session> {
    return this.resolveSession(sessionId, userId, appClientId);
  }

  /** 发送消息时确保会话已绑定 Agent（请求参数 > 会话已有 > Auto Agent）。 */
  async ensureSessionAgent(
    session: Session,
    agentIdOverride: number | undefined,
    appClientId: number,
    input?: {
      userMessage?: string;
      pageContext?: AgentChatPageContext | null;
    },
  ): Promise<Session> {
    const selection = await this.resolveAgentSelection({
      requestedAgentId: agentIdOverride,
      sessionAgentId: session.agentId ?? null,
      userId: session.userId,
      appClientId,
      userMessage: input?.userMessage ?? '',
      pageContext: input?.pageContext ?? null,
    });
    if (session.agentId === selection.agentId) {
      return session;
    }
    return this.prisma.session.update({
      where: { id: session.id },
      data: { agentId: selection.agentId },
    });
  }

  private resolveAgentSelection(input: {
    requestedAgentId?: number;
    sessionAgentId?: number | null;
    userId: number;
    appClientId: number;
    userMessage: string;
    pageContext?: AgentChatPageContext | null;
  }) {
    return this.agentAutoSelect.select({
      appClientId: input.appClientId,
      userId: input.userId,
      userMessage: input.userMessage,
      pageContext: input.pageContext ?? null,
      requestedAgentId: input.requestedAgentId,
      sessionAgentId: input.sessionAgentId ?? null,
    });
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
      await Promise.all([
        this.sessionContextStore.delete(sessionId),
        this.sessionGoaStore.delete(sessionId),
      ]);
    } catch {
      // redis / db 不可用时不影响主流程
    }
  }
}
