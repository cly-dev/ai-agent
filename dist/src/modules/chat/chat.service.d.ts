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
import { AgentAutoSelectService } from './agent-auto-select.service';
import type { AgentChatPageContext } from '../../core/host-bridge';
export declare class ChatService {
    private readonly prisma;
    private readonly chatEvents;
    private readonly sessionContextStore;
    private readonly sessionGoaStore;
    private readonly sessionPrepareStore;
    private readonly sessionPrepareService;
    private readonly runtimeCacheInvalidator;
    private readonly messageService;
    private readonly sessionRunCoordinator;
    private readonly pendingWriteConfirmationStore;
    private readonly agentAutoSelect;
    private static readonly SESSION_ID_HEX;
    constructor(prisma: PrismaService, chatEvents: ChatEventsService, sessionContextStore: SessionContextStore, sessionGoaStore: SessionGoaStore, sessionPrepareStore: SessionPrepareStore, sessionPrepareService: SessionPrepareService, runtimeCacheInvalidator: RuntimeCacheInvalidator, messageService: MessageService, sessionRunCoordinator: SessionRunCoordinator, pendingWriteConfirmationStore: PendingWriteConfirmationStore, agentAutoSelect: AgentAutoSelectService);
    cancelSessionRun(sessionId: string, userId: number, appClientId: number, runId?: number): Promise<CancelSessionRunResult>;
    getSessionRunState(sessionId: string, userId: number, appClientId: number): Promise<{
        pendingWriteGate: import("./chat-pending-write-gate.mapper").PendingWriteGatePublicState;
        generation: number;
        activeRunId: number;
        activeTurnId: number;
        pendingJobCount: number;
        redisBacked: boolean;
    }>;
    create(userId: number, appClientId: number, dto: CreateChatDto): Promise<{
        sessionId: string;
        agent: {
            id: number;
            source: string;
            reason: string;
        };
    }>;
    findAllForUser(userId: number, appClientId: number, query: QueryChatListDto): Promise<PaginatedResult<{
        sessionId: string;
        title: string | null;
        agentId: number | null;
        createdAt: Date;
    }>>;
    findOneForUser(sessionId: string, userId: number, appClientId: number, query: QueryChatListDto): Promise<{
        sessionId: string;
        title: string | null;
        agentId: number | null;
        createdAt: Date;
        messages: PaginatedResult<Message>;
    }>;
    remove(sessionId: string, userId: number, appClientId: number): Promise<DeleteChatResponseDto>;
    assertSessionOwnedByUser(sessionId: string, userId: number, appClientId: number): Promise<Session>;
    ensureSessionAgent(session: Session, agentIdOverride: number | undefined, appClientId: number, input?: {
        userMessage?: string;
        pageContext?: AgentChatPageContext | null;
    }): Promise<Session>;
    private resolveAgentSelection;
    private resolveSession;
    private createSessionId;
    private normalizeSessionId;
    private clearSessionContext;
}
