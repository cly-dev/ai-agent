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
var SessionMessageContextSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionMessageContextSyncService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const session_context_trim_util_1 = require("./session-context-trim.util");
const session_context_store_1 = require("./session-context.store");
const session_context_types_1 = require("./session-context.types");
let SessionMessageContextSyncService = SessionMessageContextSyncService_1 = class SessionMessageContextSyncService {
    constructor(prisma, sessionContextStore) {
        this.prisma = prisma;
        this.sessionContextStore = sessionContextStore;
        this.logger = new common_1.Logger(SessionMessageContextSyncService_1.name);
    }
    messageToTurn(message) {
        var _a, _b, _c, _d;
        return {
            messageId: message.id,
            role: message.role,
            content: (_a = message.content) !== null && _a !== void 0 ? _a : null,
            toolName: (_b = message.toolName) !== null && _b !== void 0 ? _b : null,
            toolInput: (_c = message.toolInput) !== null && _c !== void 0 ? _c : null,
            toolOutput: (_d = message.toolOutput) !== null && _d !== void 0 ? _d : null,
            createdAt: message.createdAt.toISOString(),
        };
    }
    async syncAfterMessageContentUpdate(sessionId, message) {
        try {
            const turn = this.messageToTurn(message);
            const patched = await this.sessionContextStore.tryPatchMerge(sessionId, (current) => {
                if (!(0, session_context_types_1.isSessionContextPayload)(current)) {
                    return current;
                }
                const payload = current;
                const turns = payload.turns.map((row) => row.messageId === turn.messageId ? turn : row);
                return Object.assign(Object.assign({}, payload), { sessionId,
                    turns, updatedAt: new Date().toISOString() });
            });
            if (patched == null || !(0, session_context_types_1.isSessionContextPayload)(patched)) {
                await this.rebuildFromDb(sessionId);
            }
        }
        catch (error) {
            this.logger.warn(`failed to sync redis session context update for sessionId=${sessionId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async syncAfterMessageCreate(sessionId, message) {
        try {
            const turn = this.messageToTurn(message);
            const patched = await this.sessionContextStore.tryPatchMerge(sessionId, (current) => {
                if (!(0, session_context_types_1.isSessionContextPayload)(current)) {
                    return current;
                }
                const payload = current;
                const last = payload.turns[payload.turns.length - 1];
                if ((last === null || last === void 0 ? void 0 : last.messageId) === turn.messageId) {
                    return payload;
                }
                return Object.assign(Object.assign({}, payload), { sessionId, turns: [...payload.turns, turn], updatedAt: new Date().toISOString() });
            });
            if (patched == null) {
                await this.rebuildFromDb(sessionId);
                return;
            }
            if (!(0, session_context_types_1.isSessionContextPayload)(patched)) {
                await this.rebuildFromDb(sessionId);
            }
        }
        catch (error) {
            this.logger.warn(`failed to sync redis session context for sessionId=${sessionId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async rebuildFromDb(sessionId) {
        try {
            const rows = await this.prisma.message.findMany({
                where: { sessionId },
                orderBy: { createdAt: 'asc' },
            });
            const existing = await this.sessionContextStore.get(sessionId);
            const prevPayload = existing && (0, session_context_types_1.isSessionContextPayload)(existing) ? existing : undefined;
            let turns = rows.map((row) => this.messageToTurn(row));
            const compressedUpToMessageId = prevPayload === null || prevPayload === void 0 ? void 0 : prevPayload.compressedUpToMessageId;
            if (compressedUpToMessageId != null) {
                turns = (0, session_context_trim_util_1.trimTurnsByCompressedWatermark)(turns, compressedUpToMessageId);
            }
            const updatedAt = new Date().toISOString();
            const cached = prevPayload != null
                ? await this.sessionContextStore.tryPatch(sessionId, {
                    turns,
                    updatedAt,
                })
                : await this.sessionContextStore.tryPatch(sessionId, {
                    sessionId,
                    turns,
                    compressedUpToMessageId,
                    updatedAt,
                });
            if (!cached) {
                this.logger.debug(`session context rebuild skipped (Redis unavailable) sessionId=${sessionId}`);
            }
        }
        catch (error) {
            this.logger.warn(`failed to rebuild redis session context for sessionId=${sessionId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
};
SessionMessageContextSyncService = SessionMessageContextSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        session_context_store_1.SessionContextStore])
], SessionMessageContextSyncService);
exports.SessionMessageContextSyncService = SessionMessageContextSyncService;
//# sourceMappingURL=session-message-context-sync.service.js.map