"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MessageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = void 0;
const common_1 = require("@nestjs/common");
const agent_engine_service_1 = require("../../core/agent-engine/engine/agent-engine.service");
const session_message_context_sync_service_1 = require("../../core/memory/context/session-message-context-sync.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const chat_events_service_1 = require("../chat/chat-events.service");
const chat_service_1 = require("../chat/chat.service");
const pending_write_confirmation_store_1 = require("../chat/pending-write-confirmation.store");
const host_bridge_1 = require("../../core/host-bridge");
const write_confirm_action_message_util_1 = require("../../core/agent-engine/engine/write-confirm-action-message.util");
const session_run_coordinator_service_1 = require("../../core/session-run/session-run-coordinator.service");
let MessageService = MessageService_1 = class MessageService {
    constructor(prisma, chatService, chatEvents, pendingWriteConfirmationStore, sessionMessageContext, agentEngine, sessionRunCoordinator) {
        this.prisma = prisma;
        this.chatService = chatService;
        this.chatEvents = chatEvents;
        this.pendingWriteConfirmationStore = pendingWriteConfirmationStore;
        this.sessionMessageContext = sessionMessageContext;
        this.agentEngine = agentEngine;
        this.sessionRunCoordinator = sessionRunCoordinator;
        this.logger = new common_1.Logger(MessageService_1.name);
    }
    async create(userId, sessionId, dto, appClientId) {
        var _a, _b, _c, _d;
        const session = await this.chatService.assertSessionOwnedByUser(sessionId, userId, appClientId);
        const confirmWrite = dto.confirmWrite === true;
        const cancelWrite = dto.cancelWrite === true;
        const isWriteConfirmAction = dto.role === 'user' &&
            (confirmWrite || cancelWrite) &&
            !String((_a = dto.content) !== null && _a !== void 0 ? _a : '').trim();
        let boundSession = session;
        if (dto.role === 'user') {
            boundSession = await this.chatService.ensureSessionAgent(session, dto.agentId, appClientId);
            if (dto.skillId != null && !confirmWrite && !cancelWrite) {
                await this.agentEngine.assertRequestedSkillRunnable({
                    userId,
                    appClientId,
                    agentId: boundSession.agentId,
                    sessionId: boundSession.id,
                    skillId: dto.skillId,
                });
            }
        }
        const pageContext = (0, host_bridge_1.parsePageContextFromMessageFields)(dto);
        let messageContent = isWriteConfirmAction
            ? null
            : this.normalizeMessageContentForStorage(dto.content);
        let messageToolName = (_b = dto.toolName) !== null && _b !== void 0 ? _b : null;
        let messageToolInput = this.toJson(dto.toolInput);
        let messagePageContext = pageContext;
        if (isWriteConfirmAction) {
            const pending = await this.pendingWriteConfirmationStore.get(session.id, userId);
            const persisted = (0, write_confirm_action_message_util_1.buildWriteConfirmActionMessagePersistence)({
                action: cancelWrite ? 'cancel_write' : 'confirm_write',
                pending,
                incomingPageContext: pageContext,
            });
            messageContent = persisted.content;
            messageToolName = persisted.toolName;
            messageToolInput = persisted.toolInput;
            messagePageContext = (_c = persisted.pageContext) !== null && _c !== void 0 ? _c : pageContext;
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
                    ? messagePageContext
                    : undefined,
            },
        });
        await this.sessionMessageContext.syncAfterMessageCreate(session.id, message);
        if (message.role === 'assistant' && dto.turnId != null) {
            await this.linkAssistantOutputToTurn(userId, session.id, dto.turnId, message.id);
        }
        if (message.role === 'user') {
            const kind = cancelWrite
                ? 'write_cancel'
                : confirmWrite
                    ? 'write_confirm'
                    : 'chat_turn';
            const policy = kind === 'chat_turn' ? 'supersede' : 'queue';
            const job = this.sessionRunCoordinator.buildJob({
                kind,
                sessionId: boundSession.id,
                userId,
                appClientId,
                userMessageId: message.id,
                input: (_d = message.content) !== null && _d !== void 0 ? _d : '',
                requestedSkillId: dto.skillId,
                pageContext: messagePageContext,
            });
            const runGeneration = await this.sessionRunCoordinator.enqueue(job, policy);
            return Object.assign(Object.assign({}, message), { runGeneration });
        }
        return message;
    }
    async findAllBySession(sessionId, userId, appClientId, query) {
        const detail = await this.chatService.findOneForUser(sessionId, userId, appClientId, query);
        return detail.messages;
    }
    async findOne(id, userId) {
        const row = await this.prisma.message.findFirst({
            where: { id },
            include: { session: true },
        });
        if (!row || row.session.userId !== userId) {
            throw new common_1.NotFoundException('message not found');
        }
        return this.stripSession(row);
    }
    async update(id, userId, dto) {
        const existing = await this.findOne(id, userId);
        const message = await this.prisma.message.update({
            where: { id },
            data: {
                role: dto.role,
                content: dto.content === undefined
                    ? undefined
                    : this.normalizeMessageContentForStorage(dto.content),
                toolName: dto.toolName,
                toolInput: dto.toolInput === undefined ? undefined : this.toJson(dto.toolInput),
                toolOutput: dto.toolOutput === undefined
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
    async remove(id, userId) {
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
    async linkAssistantOutputToTurn(userId, sessionId, turnId, messageId) {
        const turn = await this.prisma.messageTurn.findFirst({
            where: { id: turnId, sessionId, userId },
            select: { id: true },
        });
        if (!turn) {
            throw new common_1.NotFoundException('message turn not found');
        }
        await this.prisma.messageTurn.update({
            where: { id: turnId },
            data: { outputMessageId: messageId },
        });
    }
    toJson(value) {
        if (value === undefined) {
            return undefined;
        }
        return value;
    }
    normalizeMessageContentForStorage(value) {
        if (value === null || value === undefined) {
            return null;
        }
        if (typeof value === 'string') {
            return value;
        }
        try {
            return JSON.stringify(value);
        }
        catch (_a) {
            return String(value);
        }
    }
    stripSession(row) {
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
};
MessageService = MessageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => chat_service_1.ChatService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        chat_service_1.ChatService,
        chat_events_service_1.ChatEventsService,
        pending_write_confirmation_store_1.PendingWriteConfirmationStore,
        session_message_context_sync_service_1.SessionMessageContextSyncService,
        agent_engine_service_1.AgentEngineService,
        session_run_coordinator_service_1.SessionRunCoordinator])
], MessageService);
exports.MessageService = MessageService;
//# sourceMappingURL=message.service.js.map