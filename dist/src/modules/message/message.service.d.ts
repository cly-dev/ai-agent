import type { Message } from '../../../generated/prisma/client';
import { AgentEngineService } from '../../core/agent-engine/engine/agent-engine.service';
import { SessionMessageContextSyncService } from '../../core/memory/context/session-message-context-sync.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatEventsService } from '../chat/chat-events.service';
import { ChatService } from '../chat/chat.service';
import { PendingWriteConfirmationStore } from '../chat/pending-write-confirmation.store';
import type { QueryChatListDto } from '../chat/dto/query-chat-list.dto';
import { SessionRunCoordinator } from '../../core/session-run/session-run-coordinator.service';
import { SaveMessageDto } from './dto/save-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
export declare class MessageService {
    private readonly prisma;
    private readonly chatService;
    private readonly chatEvents;
    private readonly pendingWriteConfirmationStore;
    private readonly sessionMessageContext;
    private readonly agentEngine;
    private readonly sessionRunCoordinator;
    private readonly logger;
    constructor(prisma: PrismaService, chatService: ChatService, chatEvents: ChatEventsService, pendingWriteConfirmationStore: PendingWriteConfirmationStore, sessionMessageContext: SessionMessageContextSyncService, agentEngine: AgentEngineService, sessionRunCoordinator: SessionRunCoordinator);
    create(userId: number, sessionId: string, dto: SaveMessageDto, appClientId: number): Promise<Message & {
        runGeneration?: number;
    }>;
    findAllBySession(sessionId: string, userId: number, appClientId: number, query: QueryChatListDto): Promise<import("../../common/pagination").PaginatedResult<{
        role: string;
        id: number;
        createdAt: Date;
        sessionId: string;
        content: string;
        toolName: string;
        toolInput: import("@prisma/client/runtime/client").JsonValue;
        toolOutput: import("@prisma/client/runtime/client").JsonValue;
        pageContextJson: import("@prisma/client/runtime/client").JsonValue;
    }>>;
    findOne(id: number, userId: number): Promise<Message>;
    update(id: number, userId: number, dto: UpdateMessageDto): Promise<Message>;
    remove(id: number, userId: number): Promise<void>;
    private linkAssistantOutputToTurn;
    private toJson;
    private normalizeMessageContentForStorage;
    private stripSession;
    private resolveWriteGateJobKind;
}
