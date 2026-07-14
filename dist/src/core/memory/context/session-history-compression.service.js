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
var SessionHistoryCompressionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionHistoryCompressionService = void 0;
const common_1 = require("@nestjs/common");
const message_token_budget_util_1 = require("../../llm/message-token-budget.util");
const llm_service_1 = require("../../llm/llm.service");
const session_context_format_1 = require("./session-context.format");
const memory_constants_1 = require("../shared/memory.constants");
const session_context_trim_util_1 = require("./session-context-trim.util");
const session_history_summary_util_1 = require("./session-history-summary.util");
const prompt_template_keys_1 = require("../../prompt/prompt-template.keys");
const prompt_registry_service_1 = require("../../prompt/prompt-registry.service");
const prisma_service_1 = require("../../../prisma/prisma.service");
const session_context_store_1 = require("./session-context.store");
const session_goa_store_1 = require("../goa/session-goa.store");
const session_context_types_1 = require("./session-context.types");
const MAX_TURN_CHARS_FOR_COMPRESS = 600;
let SessionHistoryCompressionService = SessionHistoryCompressionService_1 = class SessionHistoryCompressionService {
    constructor(sessionContextStore, goaStore, llmService, promptRegistry, prisma) {
        this.sessionContextStore = sessionContextStore;
        this.goaStore = goaStore;
        this.llmService = llmService;
        this.promptRegistry = promptRegistry;
        this.prisma = prisma;
        this.logger = new common_1.Logger(SessionHistoryCompressionService_1.name);
    }
    async maybeCompressAfterTurn(sessionId) {
        try {
            const raw = await this.sessionContextStore.get(sessionId);
            if (!raw || !(0, session_context_types_1.isSessionContextPayload)(raw)) {
                return;
            }
            const keepRecent = (0, memory_constants_1.getSessionHistoryKeepRecentTurns)();
            const compressAfter = (0, memory_constants_1.getSessionHistoryCompressAfterTurns)();
            if (raw.turns.length <= compressAfter) {
                return;
            }
            const oldTurns = raw.turns.slice(0, -keepRecent);
            if (oldTurns.length === 0) {
                return;
            }
            const upToMessageId = oldTurns[oldTurns.length - 1].messageId;
            if (raw.compressedUpToMessageId != null &&
                upToMessageId <= raw.compressedUpToMessageId) {
                return;
            }
            const goa = await this.goaStore.get(sessionId);
            const summary = await this.synthesizeHistorySummary(sessionId, raw.compressedHistorySummary, oldTurns, goa);
            if (!(0, session_history_summary_util_1.isSessionHistorySummaryAcceptable)(summary)) {
                this.logger.warn(`session history compression skipped invalid summary sessionId=${sessionId}`);
                return;
            }
            const turnsBefore = raw.turns.length;
            await this.sessionContextStore.patchMerge(sessionId, (current) => {
                if (!(0, session_context_types_1.isSessionContextPayload)(current)) {
                    return {};
                }
                const trimmedTurns = (0, session_context_trim_util_1.trimTurnsByCompressedWatermark)(current.turns, upToMessageId);
                return {
                    compressedHistorySummary: summary,
                    compressedUpToMessageId: upToMessageId,
                    turns: trimmedTurns,
                    updatedAt: new Date().toISOString(),
                };
            });
            this.logger.debug(`session history compressed sessionId=${sessionId} upToMessageId=${upToMessageId} oldTurns=${oldTurns.length} turnsBefore=${turnsBefore} trim=true`);
        }
        catch (error) {
            this.logger.warn(`session history compression skipped sessionId=${sessionId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    buildPromptHistory(payload, maxMessages) {
        var _a;
        const keepRecent = Math.min((0, memory_constants_1.getSessionHistoryKeepRecentTurns)(), maxMessages);
        const recentTurns = payload.turns.slice(-keepRecent);
        const messages = [];
        const summary = (_a = payload.compressedHistorySummary) === null || _a === void 0 ? void 0 : _a.trim();
        if (summary) {
            messages.push({
                role: 'system',
                content: `<session_history_summary>\n${summary}\n</session_history_summary>`,
            });
        }
        messages.push(...(0, session_context_format_1.messageTurnsToLlmMessages)(recentTurns, keepRecent));
        return messages;
    }
    async loadSessionPromptScope(sessionId) {
        var _a, _b;
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            select: { appClientId: true, agentId: true },
        });
        return {
            appClientId: (_a = session === null || session === void 0 ? void 0 : session.appClientId) !== null && _a !== void 0 ? _a : null,
            agentId: (_b = session === null || session === void 0 ? void 0 : session.agentId) !== null && _b !== void 0 ? _b : null,
        };
    }
    async synthesizeHistorySummary(sessionId, previousSummary, turns, goa) {
        var _a, _b;
        const transcript = this.formatTurnsForCompression(turns);
        if (!transcript.trim()) {
            return (_a = previousSummary === null || previousSummary === void 0 ? void 0 : previousSummary.trim()) !== null && _a !== void 0 ? _a : '';
        }
        const maxInputTokens = (0, memory_constants_1.getSessionHistoryCompressMaxInputTokens)();
        let body = transcript;
        if ((0, message_token_budget_util_1.estimateTextTokens)(body) > maxInputTokens) {
            body = this.trimTranscriptToTokenBudget(body, maxInputTokens);
        }
        const wmBlock = (0, session_history_summary_util_1.formatSessionMemoryForCompression)(goa);
        const scope = await this.loadSessionPromptScope(sessionId);
        const systemPrompt = await this.promptRegistry.render(prompt_template_keys_1.PROMPT_KEYS.MEMORY_HISTORY_COMPRESSION, scope);
        const userParts = [
            wmBlock,
            (previousSummary === null || previousSummary === void 0 ? void 0 : previousSummary.trim())
                ? `已有摘要：\n${previousSummary.trim()}`
                : null,
            `待压缩对话（时间顺序）：\n${body}`,
        ].filter((part) => part != null);
        const result = await this.llmService.chat({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userParts.join('\n\n') },
            ],
            maxTokens: (0, memory_constants_1.getSessionHistoryCompressMaxSummaryTokens)(),
            temperature: 0.2,
            stream: false,
            budgetHints: { callKind: 'compression', skipFit: true },
        });
        const text = ((_b = result.content) !== null && _b !== void 0 ? _b : '').trim();
        return (0, session_history_summary_util_1.isSessionHistorySummaryAcceptable)(text) ? text : '';
    }
    formatTurnsForCompression(turns) {
        const lines = [];
        for (const turn of turns) {
            const body = (0, session_context_format_1.formatMessageTurnBody)(turn).trim();
            if (!body) {
                continue;
            }
            const clipped = body.length > MAX_TURN_CHARS_FOR_COMPRESS
                ? `${body.slice(0, MAX_TURN_CHARS_FOR_COMPRESS)}…`
                : body;
            lines.push(`${turn.role}: ${clipped}`);
        }
        return lines.join('\n');
    }
    trimTranscriptToTokenBudget(text, tokenBudget) {
        const lines = text.split('\n');
        while (lines.length > 0 && (0, message_token_budget_util_1.estimateTextTokens)(lines.join('\n')) > tokenBudget) {
            lines.shift();
        }
        return lines.join('\n');
    }
};
SessionHistoryCompressionService = SessionHistoryCompressionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [session_context_store_1.SessionContextStore,
        session_goa_store_1.SessionGoaStore,
        llm_service_1.LlmService,
        prompt_registry_service_1.PromptRegistryService,
        prisma_service_1.PrismaService])
], SessionHistoryCompressionService);
exports.SessionHistoryCompressionService = SessionHistoryCompressionService;
//# sourceMappingURL=session-history-compression.service.js.map