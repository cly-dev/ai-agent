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
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const pagination_1 = require("../../common/pagination");
const session_context_store_1 = require("../../core/memory/context/session-context.store");
const session_goa_store_1 = require("../../core/memory/goa/session-goa.store");
const prisma_service_1 = require("../../prisma/prisma.service");
const message_service_1 = require("../message/message.service");
const chat_events_service_1 = require("./chat-events.service");
const session_prepare_service_1 = require("./session-prepare.service");
const session_prepare_store_1 = require("./session-prepare.store");
const runtime_cache_invalidator_service_1 = require("../../core/runtime-cache/runtime-cache-invalidator.service");
const session_run_coordinator_service_1 = require("../../core/session-run/session-run-coordinator.service");
const pending_write_confirmation_store_1 = require("./pending-write-confirmation.store");
const chat_pending_write_gate_mapper_1 = require("./chat-pending-write-gate.mapper");
const host_bridge_1 = require("../../core/host-bridge");
const agent_auto_select_service_1 = require("./agent-auto-select.service");
let ChatService = ChatService_1 = class ChatService {
    constructor(prisma, chatEvents, sessionContextStore, sessionGoaStore, sessionPrepareStore, sessionPrepareService, runtimeCacheInvalidator, messageService, sessionRunCoordinator, pendingWriteConfirmationStore, agentAutoSelect) {
        this.prisma = prisma;
        this.chatEvents = chatEvents;
        this.sessionContextStore = sessionContextStore;
        this.sessionGoaStore = sessionGoaStore;
        this.sessionPrepareStore = sessionPrepareStore;
        this.sessionPrepareService = sessionPrepareService;
        this.runtimeCacheInvalidator = runtimeCacheInvalidator;
        this.messageService = messageService;
        this.sessionRunCoordinator = sessionRunCoordinator;
        this.pendingWriteConfirmationStore = pendingWriteConfirmationStore;
        this.agentAutoSelect = agentAutoSelect;
    }
    async cancelSessionRun(sessionId, userId, appClientId, runId) {
        await this.assertSessionOwnedByUser(sessionId, userId, appClientId);
        return this.sessionRunCoordinator.cancelRun(sessionId, userId, runId);
    }
    async getSessionRunState(sessionId, userId, appClientId) {
        await this.assertSessionOwnedByUser(sessionId, userId, appClientId);
        const [runState, pending] = await Promise.all([
            this.sessionRunCoordinator.getRunState(sessionId),
            this.pendingWriteConfirmationStore.get(sessionId, userId),
        ]);
        return Object.assign(Object.assign({}, runState), { pendingWriteGate: pending
                ? (0, chat_pending_write_gate_mapper_1.buildPendingWriteGatePublicState)(pending)
                : null });
    }
    async create(userId, appClientId, dto) {
        const pageContext = (0, host_bridge_1.parsePageContextFromMessageFields)(dto);
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
            await this.sessionPrepareService.warm(session.id, userId, appClientId, pageContext);
            await this.messageService.create(userId, session.id, dto, appClientId);
        }
        catch (error) {
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
    async findAllForUser(userId, appClientId, query) {
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.size);
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
        return (0, pagination_1.toPaginatedResult)(sessions.map((session) => {
            var _a, _b;
            return ({
                sessionId: session.id,
                title: (_a = session.title) !== null && _a !== void 0 ? _a : null,
                agentId: (_b = session.agentId) !== null && _b !== void 0 ? _b : null,
                createdAt: session.createdAt,
            });
        }), total, page, pageSize);
    }
    async findOneForUser(sessionId, userId, appClientId, query) {
        var _a, _b;
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
            throw new common_1.NotFoundException('chat not found');
        }
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.size);
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
            title: (_a = session.title) !== null && _a !== void 0 ? _a : null,
            agentId: (_b = session.agentId) !== null && _b !== void 0 ? _b : null,
            createdAt: session.createdAt,
            messages: (0, pagination_1.toPaginatedResult)([...rows].reverse(), total, page, pageSize),
        };
    }
    async remove(sessionId, userId, appClientId) {
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
    async assertSessionOwnedByUser(sessionId, userId, appClientId) {
        return this.resolveSession(sessionId, userId, appClientId);
    }
    async ensureSessionAgent(session, agentIdOverride, appClientId, input) {
        var _a, _b, _c;
        const selection = await this.resolveAgentSelection({
            requestedAgentId: agentIdOverride,
            sessionAgentId: (_a = session.agentId) !== null && _a !== void 0 ? _a : null,
            userId: session.userId,
            appClientId,
            userMessage: (_b = input === null || input === void 0 ? void 0 : input.userMessage) !== null && _b !== void 0 ? _b : '',
            pageContext: (_c = input === null || input === void 0 ? void 0 : input.pageContext) !== null && _c !== void 0 ? _c : null,
        });
        if (session.agentId === selection.agentId) {
            return session;
        }
        return this.prisma.session.update({
            where: { id: session.id },
            data: { agentId: selection.agentId },
        });
    }
    resolveAgentSelection(input) {
        var _a, _b;
        return this.agentAutoSelect.select({
            appClientId: input.appClientId,
            userId: input.userId,
            userMessage: input.userMessage,
            pageContext: (_a = input.pageContext) !== null && _a !== void 0 ? _a : null,
            requestedAgentId: input.requestedAgentId,
            sessionAgentId: (_b = input.sessionAgentId) !== null && _b !== void 0 ? _b : null,
        });
    }
    async resolveSession(sessionId, userId, appClientId) {
        const normalizedSessionId = this.normalizeSessionId(sessionId);
        const row = await this.prisma.session.findFirst({
            where: { id: normalizedSessionId, userId, appClientId },
        });
        if (!row) {
            throw new common_1.NotFoundException('chat not found');
        }
        return row;
    }
    createSessionId() {
        return (0, crypto_1.randomBytes)(16).toString('hex');
    }
    normalizeSessionId(sessionId) {
        const value = sessionId.trim().toLowerCase();
        if (!ChatService_1.SESSION_ID_HEX.test(value)) {
            throw new common_1.BadRequestException('sessionId must be a 32-character lowercase hex string');
        }
        return value;
    }
    async clearSessionContext(sessionId) {
        try {
            await Promise.all([
                this.sessionContextStore.delete(sessionId),
                this.sessionGoaStore.delete(sessionId),
            ]);
        }
        catch (_a) {
        }
    }
};
ChatService.SESSION_ID_HEX = /^[a-f0-9]{32}$/;
ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(7, (0, common_1.Inject)((0, common_1.forwardRef)(() => message_service_1.MessageService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        chat_events_service_1.ChatEventsService,
        session_context_store_1.SessionContextStore,
        session_goa_store_1.SessionGoaStore,
        session_prepare_store_1.SessionPrepareStore,
        session_prepare_service_1.SessionPrepareService,
        runtime_cache_invalidator_service_1.RuntimeCacheInvalidator,
        message_service_1.MessageService,
        session_run_coordinator_service_1.SessionRunCoordinator,
        pending_write_confirmation_store_1.PendingWriteConfirmationStore,
        agent_auto_select_service_1.AgentAutoSelectService])
], ChatService);
exports.ChatService = ChatService;
//# sourceMappingURL=chat.service.js.map