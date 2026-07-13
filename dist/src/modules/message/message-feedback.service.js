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
exports.MessageFeedbackService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../generated/prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const chat_service_1 = require("../chat/chat.service");
const message_feedback_constants_1 = require("./message-feedback.constants");
let MessageFeedbackService = class MessageFeedbackService {
    constructor(prisma, chatService) {
        this.prisma = prisma;
        this.chatService = chatService;
    }
    async upsertForMessage(input) {
        var _a, _b, _c, _d;
        await this.chatService.assertSessionOwnedByUser(input.sessionId, input.userId, input.appClientId);
        const message = await this.prisma.message.findFirst({
            where: {
                id: input.messageId,
                sessionId: input.sessionId,
                role: 'assistant',
            },
            select: { id: true, sessionId: true },
        });
        if (!message) {
            throw new common_1.NotFoundException('assistant message not found');
        }
        const normalized = this.normalizeUpsertPayload(input.dto);
        const turn = await this.prisma.messageTurn.findFirst({
            where: { outputMessageId: message.id },
            orderBy: { id: 'desc' },
            select: { id: true, primaryAgentId: true },
        });
        const row = await this.prisma.messageFeedback.upsert({
            where: {
                messageId_userId: {
                    messageId: message.id,
                    userId: input.userId,
                },
            },
            create: {
                messageId: message.id,
                sessionId: input.sessionId,
                userId: input.userId,
                appClientId: input.appClientId,
                turnId: (_a = turn === null || turn === void 0 ? void 0 : turn.id) !== null && _a !== void 0 ? _a : null,
                agentId: (_b = turn === null || turn === void 0 ? void 0 : turn.primaryAgentId) !== null && _b !== void 0 ? _b : null,
                rating: normalized.rating,
                reasonTags: normalized.reasonTags.length > 0
                    ? normalized.reasonTags
                    : client_1.Prisma.JsonNull,
                comment: normalized.comment,
            },
            update: {
                rating: normalized.rating,
                reasonTags: normalized.reasonTags.length > 0
                    ? normalized.reasonTags
                    : client_1.Prisma.JsonNull,
                comment: normalized.comment,
                turnId: (_c = turn === null || turn === void 0 ? void 0 : turn.id) !== null && _c !== void 0 ? _c : null,
                agentId: (_d = turn === null || turn === void 0 ? void 0 : turn.primaryAgentId) !== null && _d !== void 0 ? _d : null,
            },
        });
        return this.toView(row);
    }
    async findForMessage(input) {
        await this.chatService.assertSessionOwnedByUser(input.sessionId, input.userId, input.appClientId);
        const row = await this.prisma.messageFeedback.findFirst({
            where: {
                messageId: input.messageId,
                sessionId: input.sessionId,
                userId: input.userId,
            },
        });
        return row ? this.toView(row) : null;
    }
    async listForSessionMessages(input) {
        await this.chatService.assertSessionOwnedByUser(input.sessionId, input.userId, input.appClientId);
        const uniqueIds = [...new Set(input.messageIds)].filter((id) => id > 0);
        if (uniqueIds.length === 0) {
            return { items: [] };
        }
        const rows = await this.prisma.messageFeedback.findMany({
            where: {
                sessionId: input.sessionId,
                userId: input.userId,
                messageId: { in: uniqueIds },
            },
        });
        return { items: rows.map((row) => this.toView(row)) };
    }
    async removeForMessage(input) {
        await this.chatService.assertSessionOwnedByUser(input.sessionId, input.userId, input.appClientId);
        await this.prisma.messageFeedback.deleteMany({
            where: {
                messageId: input.messageId,
                sessionId: input.sessionId,
                userId: input.userId,
            },
        });
    }
    parseMessageIdsParam(raw) {
        const parts = raw.split(',').map((part) => part.trim());
        const ids = [];
        for (const part of parts) {
            if (!part) {
                continue;
            }
            const id = Number(part);
            if (!Number.isInteger(id) || id < 1) {
                throw new common_1.BadRequestException(`invalid messageId: ${part}`);
            }
            ids.push(id);
        }
        if (ids.length === 0) {
            throw new common_1.BadRequestException('messageIds is required');
        }
        if (ids.length > 100) {
            throw new common_1.BadRequestException('messageIds exceeds max 100');
        }
        return ids;
    }
    normalizeUpsertPayload(dto) {
        var _a, _b, _c, _d;
        if (dto.rating === 'up') {
            if (((_a = dto.reasonTags) === null || _a === void 0 ? void 0 : _a.length) || ((_b = dto.comment) === null || _b === void 0 ? void 0 : _b.trim())) {
                throw new common_1.BadRequestException('点赞不需要填写原因，请移除 reasonTags 与 comment');
            }
            return { rating: 'up', reasonTags: [], comment: null };
        }
        const reasonTags = (0, message_feedback_constants_1.normalizeDownReasonTags)(dto.reasonTags);
        for (const tag of reasonTags) {
            if (!(0, message_feedback_constants_1.isAllowedDownReasonTagKey)(tag)) {
                throw new common_1.BadRequestException(`invalid down reason tag: ${tag}`);
            }
        }
        const comment = (_d = (_c = dto.comment) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : '';
        if (reasonTags.length === 0 && !comment) {
            throw new common_1.BadRequestException('点踩须至少选择一个原因标签或填写补充说明');
        }
        if (reasonTags.includes('other') && !comment) {
            throw new common_1.BadRequestException('选择「其他」原因时须填写补充说明');
        }
        return {
            rating: 'down',
            reasonTags,
            comment: comment || null,
        };
    }
    toView(row) {
        const reasonTags = Array.isArray(row.reasonTags)
            ? row.reasonTags.filter((item) => typeof item === 'string')
            : [];
        return {
            messageId: row.messageId,
            rating: row.rating,
            reasonTags,
            comment: row.comment,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
        };
    }
};
MessageFeedbackService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        chat_service_1.ChatService])
], MessageFeedbackService);
exports.MessageFeedbackService = MessageFeedbackService;
//# sourceMappingURL=message-feedback.service.js.map