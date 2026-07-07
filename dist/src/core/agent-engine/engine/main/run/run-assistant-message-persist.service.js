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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunAssistantMessagePersistService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../../prisma/prisma.service");
const session_message_context_sync_service_1 = require("../../../../memory/context/session-message-context-sync.service");
const message_blocks_util_1 = require("../../message/message-blocks.util");
const run_assistant_artifact_store_1 = require("./run-assistant-artifact.store");
const message_blocks_debug_util_1 = require("../../message/message-blocks-debug.util");
let RunAssistantMessagePersistService = class RunAssistantMessagePersistService {
    constructor(prisma, assistantArtifact, sessionMessageContext) {
        this.prisma = prisma;
        this.assistantArtifact = assistantArtifact;
        this.sessionMessageContext = sessionMessageContext;
    }
    async persistFromArtifactInTx(tx, input) {
        var _a, _b;
        if (!this.assistantArtifact.isPersistableAssistantArtifact(input.sessionId, input.runId)) {
            return { message: null, replacedTurnOutput: false };
        }
        const artifact = this.assistantArtifact.peek(input.sessionId, input.runId);
        if (!(artifact === null || artifact === void 0 ? void 0 : artifact.serialized.trim())) {
            return { message: null, replacedTurnOutput: false };
        }
        const existingRun = await tx.agentRun.findFirst({
            where: {
                id: input.runId,
                sessionId: input.sessionId,
                turnId: input.turnId,
            },
            select: { outputMessageId: true },
        });
        if (!existingRun) {
            throw new common_1.NotFoundException('agent run not found');
        }
        if (existingRun.outputMessageId != null) {
            const message = await tx.message.findUnique({
                where: { id: existingRun.outputMessageId },
            });
            (0, message_blocks_debug_util_1.logPersistContentMismatch)({
                sessionId: input.sessionId,
                runId: input.runId,
                turnId: input.turnId,
                tag: 'PERSIST_RUN_ALREADY_LINKED',
                artifactSerialized: artifact.serialized,
                priorDbContent: (_a = message === null || message === void 0 ? void 0 : message.content) !== null && _a !== void 0 ? _a : '',
            });
            return { message, replacedTurnOutput: false };
        }
        const session = await tx.session.findFirst({
            where: { id: input.sessionId, userId: input.userId },
            select: { id: true },
        });
        if (!session) {
            throw new common_1.NotFoundException('chat not found');
        }
        const turn = await tx.messageTurn.findFirst({
            where: {
                id: artifact.turnId,
                sessionId: session.id,
                userId: input.userId,
            },
            select: { id: true, outputMessageId: true },
        });
        if (!turn) {
            throw new common_1.NotFoundException('message turn not found');
        }
        if (turn.outputMessageId != null) {
            const sealedByUserReply = (await tx.message.count({
                where: {
                    sessionId: session.id,
                    role: 'user',
                    id: { gt: turn.outputMessageId },
                },
            })) > 0;
            if (!sealedByUserReply) {
                const existing = await tx.message.findUnique({
                    where: { id: turn.outputMessageId },
                });
                (0, message_blocks_debug_util_1.logPersistContentMismatch)({
                    sessionId: input.sessionId,
                    runId: input.runId,
                    turnId: input.turnId,
                    tag: 'PERSIST_TURN_UPDATE',
                    artifactSerialized: artifact.serialized,
                    priorDbContent: (_b = existing === null || existing === void 0 ? void 0 : existing.content) !== null && _b !== void 0 ? _b : '',
                });
                const message = await tx.message.update({
                    where: { id: turn.outputMessageId },
                    data: { content: artifact.serialized },
                });
                (0, message_blocks_debug_util_1.emitAgentMessagePersistDebug)({
                    tag: 'PERSIST_UPDATE',
                    sessionId: input.sessionId,
                    runId: input.runId,
                    turnId: input.turnId,
                    messageId: message.id,
                    dbContent: message.content,
                    source: (0, message_blocks_debug_util_1.serializedSourceSnapshot)(artifact.serialized, {
                        label: 'artifact',
                        blocks: artifact.blocks,
                    }),
                });
                await tx.agentRun.update({
                    where: { id: input.runId },
                    data: { outputMessageId: message.id },
                });
                return { message, replacedTurnOutput: true };
            }
        }
        const message = await tx.message.create({
            data: {
                sessionId: session.id,
                role: 'assistant',
                content: artifact.serialized,
            },
        });
        (0, message_blocks_debug_util_1.emitAgentMessagePersistDebug)({
            tag: 'PERSIST_CREATE',
            sessionId: input.sessionId,
            runId: input.runId,
            turnId: input.turnId,
            messageId: message.id,
            dbContent: message.content,
            source: (0, message_blocks_debug_util_1.serializedSourceSnapshot)(artifact.serialized, {
                label: 'artifact',
                blocks: artifact.blocks,
            }),
        });
        await tx.agentRun.update({
            where: { id: input.runId },
            data: { outputMessageId: message.id },
        });
        await tx.messageTurn.update({
            where: { id: turn.id },
            data: { outputMessageId: message.id },
        });
        return { message, replacedTurnOutput: false };
    }
    async appendNoticeToTurnOutput(input) {
        var _a, _b, _c;
        const trimmed = input.noticeMarkdown.trim();
        if (!trimmed) {
            return null;
        }
        const noticeBlock = (0, message_blocks_util_1.textBlock)(trimmed, 'markdown');
        const session = await this.prisma.session.findFirst({
            where: { id: input.sessionId, userId: input.userId },
            select: { id: true },
        });
        if (!session) {
            return null;
        }
        const turn = await this.prisma.messageTurn.findFirst({
            where: {
                id: input.turnId,
                sessionId: session.id,
                userId: input.userId,
            },
            select: { id: true, outputMessageId: true },
        });
        if (!turn) {
            return null;
        }
        let message;
        let replacedTurnOutput = false;
        if (turn.outputMessageId != null) {
            const existing = await this.prisma.message.findUnique({
                where: { id: turn.outputMessageId },
            });
            if (!existing) {
                return null;
            }
            const priorBlocks = (_b = (0, message_blocks_util_1.tryParseStoredMessageBlocks)((_a = existing.content) !== null && _a !== void 0 ? _a : '')) !== null && _b !== void 0 ? _b : (((_c = existing.content) === null || _c === void 0 ? void 0 : _c.trim())
                ? [(0, message_blocks_util_1.textBlock)(existing.content.trim(), 'markdown')]
                : []);
            const merged = (0, message_blocks_util_1.sanitizeMessageBlocks)([...priorBlocks, noticeBlock]);
            const serialized = (0, message_blocks_util_1.serializeMessageBlocksForStorage)(merged);
            message = await this.prisma.message.update({
                where: { id: existing.id },
                data: { content: serialized },
            });
            replacedTurnOutput = true;
            (0, message_blocks_debug_util_1.emitAgentMessagePersistDebug)({
                tag: 'PERSIST_APPEND_NOTICE',
                sessionId: input.sessionId,
                runId: 0,
                turnId: input.turnId,
                messageId: message.id,
                dbContent: message.content,
                source: {
                    priorContent: existing.content,
                    noticeMarkdown: trimmed,
                    mergedBlocks: merged,
                },
            });
        }
        else {
            const serialized = (0, message_blocks_util_1.serializeMessageBlocksForStorage)([noticeBlock]);
            message = await this.prisma.message.create({
                data: {
                    sessionId: session.id,
                    role: 'assistant',
                    content: serialized,
                },
            });
            await this.prisma.messageTurn.update({
                where: { id: turn.id },
                data: { outputMessageId: message.id, finalOutput: serialized },
            });
            (0, message_blocks_debug_util_1.emitAgentMessagePersistDebug)({
                tag: 'PERSIST_CREATE_NOTICE',
                sessionId: input.sessionId,
                runId: 0,
                turnId: input.turnId,
                messageId: message.id,
                dbContent: message.content,
                source: { noticeMarkdown: trimmed },
            });
        }
        await this.syncPersistedMessage(input.sessionId, message, {
            replacedTurnOutput,
        });
        return message;
    }
    async syncPersistedMessage(sessionId, message, options) {
        if (options === null || options === void 0 ? void 0 : options.replacedTurnOutput) {
            await this.sessionMessageContext.syncAfterMessageContentUpdate(sessionId, message);
            return;
        }
        await this.sessionMessageContext.syncAfterMessageCreate(sessionId, message);
    }
};
RunAssistantMessagePersistService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        run_assistant_artifact_store_1.RunAssistantArtifactStore,
        session_message_context_sync_service_1.SessionMessageContextSyncService])
], RunAssistantMessagePersistService);
exports.RunAssistantMessagePersistService = RunAssistantMessagePersistService;
//# sourceMappingURL=run-assistant-message-persist.service.js.map