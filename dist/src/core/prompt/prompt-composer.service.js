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
var PromptComposerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptComposerService = void 0;
const common_1 = require("@nestjs/common");
const session_history_compression_service_1 = require("../memory/context/session-history-compression.service");
const user_memory_store_1 = require("../memory/user/user-memory.store");
const session_goa_service_1 = require("../memory/goa/session-goa.service");
const session_context_format_1 = require("../memory/context/session-context.format");
const session_context_store_1 = require("../memory/context/session-context.store");
const session_context_types_1 = require("../memory/context/session-context.types");
const prisma_service_1 = require("../../prisma/prisma.service");
const prompt_template_keys_1 = require("./prompt-template.keys");
const prompt_registry_service_1 = require("./prompt-registry.service");
const page_context_prompt_util_1 = require("../host-bridge/page-context.prompt.util");
let PromptComposerService = PromptComposerService_1 = class PromptComposerService {
    constructor(prisma, userMemoryStore, sessionGoa, sessionHistoryCompression, sessionContextStore, promptRegistry) {
        this.prisma = prisma;
        this.userMemoryStore = userMemoryStore;
        this.sessionGoa = sessionGoa;
        this.sessionHistoryCompression = sessionHistoryCompression;
        this.sessionContextStore = sessionContextStore;
        this.promptRegistry = promptRegistry;
        this.logger = new common_1.Logger(PromptComposerService_1.name);
    }
    async compose(input) {
        var _a, _b;
        const sessionScope = (_a = input.sessionScope) !== null && _a !== void 0 ? _a : (await this.loadSessionScope(input.sessionId));
        const agentPromptSource = input.agentSystemPrompt !== undefined
            ? this.composeAgentPrompt(input.agentSystemPrompt)
            : await this.loadAgentPrompt(input.sessionId);
        const [userMemory, sessionPayload, conversation, responseStyle, messageBlocksSpec,] = await Promise.all([
            this.userMemoryStore.get(input.userId),
            this.sessionGoa.ensurePayload(input.sessionId),
            this.loadRecentConversationMessages(input.sessionId),
            this.promptRegistry.render(prompt_template_keys_1.PROMPT_KEYS.PLATFORM_RESPONSE_STYLE, sessionScope),
            this.promptRegistry.render(prompt_template_keys_1.PROMPT_KEYS.PLATFORM_MESSAGE_BLOCKS_SPEC, sessionScope),
        ]);
        const sessionMemoryMessages = this.sessionGoa.buildPromptMessages(sessionPayload);
        const agentPrompt = agentPromptSource;
        const messages = [];
        if (agentPrompt) {
            messages.push({
                role: 'system',
                content: `<agent_prompt>\n${agentPrompt}\n</agent_prompt>`,
            });
        }
        messages.push({
            role: 'system',
            content: responseStyle,
        });
        messages.push({
            role: 'system',
            content: messageBlocksSpec,
        });
        if (userMemory) {
            messages.push({
                role: 'system',
                content: `<user_memory>\n${JSON.stringify(userMemory)}\n</user_memory>`,
            });
        }
        for (const memoryMessage of sessionMemoryMessages) {
            messages.push(memoryMessage);
        }
        if (conversation.length > 0) {
            messages.push({
                role: 'system',
                content: '<session_history>Earlier turns may appear as session_history_summary; recent turns follow. Prefer recent_episodes and active_task for goals/outcomes; use session_history for dialogue tone.</session_history>',
            });
            for (const turn of conversation) {
                messages.push(turn);
            }
        }
        else if (input.latestUserMessage.trim().length > 0) {
            this.logger.debug(`compose sessionId=${input.sessionId}: no prior messages (first turn or empty history)`);
        }
        const latest = input.latestUserMessage.trim();
        const lastTurn = conversation[conversation.length - 1];
        const alreadyContainsLatest = (lastTurn === null || lastTurn === void 0 ? void 0 : lastTurn.role) === 'user' && ((_b = lastTurn.content) !== null && _b !== void 0 ? _b : '').trim() === latest;
        if (!alreadyContainsLatest && latest.length > 0) {
            const pageContextBlock = (0, page_context_prompt_util_1.formatPageContextPromptBlock)(input.pageContext);
            if (pageContextBlock) {
                messages.push({
                    role: 'system',
                    content: pageContextBlock,
                });
            }
            messages.push({
                role: 'user',
                content: input.latestUserMessage,
            });
        }
        return { messages };
    }
    async warmSessionContext(sessionId) {
        const fromRedis = await this.loadFromRedis(sessionId);
        if (fromRedis !== null) {
            return true;
        }
        const { payload } = await this.loadFromDatabase(sessionId);
        if (payload.turns.length === 0) {
            return false;
        }
        return this.cacheSessionPayload(sessionId, payload);
    }
    async loadRecentConversationMessages(sessionId) {
        const fromRedis = await this.loadFromRedis(sessionId);
        if (fromRedis !== null) {
            return fromRedis;
        }
        this.logger.debug(`session context cache miss sessionId=${sessionId}, loading from DB`);
        const { messages, payload } = await this.loadFromDatabase(sessionId);
        const warmed = await this.cacheSessionPayload(sessionId, payload);
        if (!warmed) {
            this.logger.debug(`session context not cached (Redis unavailable) sessionId=${sessionId}`);
        }
        return messages;
    }
    async cacheSessionPayload(sessionId, payload) {
        const existing = await this.sessionContextStore.get(sessionId);
        if (existing && (0, session_context_types_1.isSessionContextPayload)(existing)) {
            const patched = await this.sessionContextStore.tryPatch(sessionId, {
                turns: payload.turns,
                updatedAt: payload.updatedAt,
            });
            return patched != null;
        }
        return this.sessionContextStore.trySet(sessionId, payload);
    }
    async loadFromRedis(sessionId) {
        const raw = await this.sessionContextStore.get(sessionId);
        if (!raw || !(0, session_context_types_1.isSessionContextPayload)(raw)) {
            return null;
        }
        if (raw.sessionId !== sessionId) {
            return null;
        }
        return this.sessionHistoryCompression.buildPromptHistory(raw, PromptComposerService_1.MAX_SESSION_MESSAGES);
    }
    async loadFromDatabase(sessionId) {
        const rows = await this.prisma.message.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                role: true,
                content: true,
                toolName: true,
                toolInput: true,
                toolOutput: true,
                createdAt: true,
            },
        });
        const turns = rows.map((row) => (0, session_context_format_1.dbMessageRowToMessageTurn)(row));
        const payload = {
            sessionId,
            turns,
            updatedAt: new Date().toISOString(),
        };
        const cached = await this.sessionContextStore.get(sessionId);
        if (cached && (0, session_context_types_1.isSessionContextPayload)(cached)) {
            payload.compressedHistorySummary = cached.compressedHistorySummary;
            payload.compressedUpToMessageId = cached.compressedUpToMessageId;
        }
        return {
            messages: this.sessionHistoryCompression.buildPromptHistory(payload, PromptComposerService_1.MAX_SESSION_MESSAGES),
            payload,
        };
    }
    async loadSessionScope(sessionId) {
        var _a, _b;
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            select: { agentId: true, appClientId: true },
        });
        return {
            appClientId: (_a = session === null || session === void 0 ? void 0 : session.appClientId) !== null && _a !== void 0 ? _a : null,
            agentId: (_b = session === null || session === void 0 ? void 0 : session.agentId) !== null && _b !== void 0 ? _b : null,
        };
    }
    async loadAgentPrompt(sessionId) {
        var _a;
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            select: { agentId: true, appClientId: true },
        });
        if (!(session === null || session === void 0 ? void 0 : session.agentId)) {
            return null;
        }
        const agent = await this.prisma.agent.findFirst({
            where: { id: session.agentId, appClientId: session.appClientId },
            select: { systemPrompt: true },
        });
        return this.composeAgentPrompt((_a = agent === null || agent === void 0 ? void 0 : agent.systemPrompt) !== null && _a !== void 0 ? _a : null);
    }
    composeAgentPrompt(systemPrompt) {
        if (!systemPrompt) {
            return null;
        }
        const value = systemPrompt.trim();
        return value.length > 0 ? value : null;
    }
};
PromptComposerService.MAX_SESSION_MESSAGES = 80;
PromptComposerService = PromptComposerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        user_memory_store_1.UserMemoryStore,
        session_goa_service_1.SessionGoaService,
        session_history_compression_service_1.SessionHistoryCompressionService,
        session_context_store_1.SessionContextStore,
        prompt_registry_service_1.PromptRegistryService])
], PromptComposerService);
exports.PromptComposerService = PromptComposerService;
//# sourceMappingURL=prompt-composer.service.js.map