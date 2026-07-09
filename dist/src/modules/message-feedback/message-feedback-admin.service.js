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
exports.MessageFeedbackAdminService = void 0;
const common_1 = require("@nestjs/common");
const pagination_1 = require("../../common/pagination");
const prisma_service_1 = require("../../prisma/prisma.service");
const message_feedback_constants_1 = require("../message/message-feedback.constants");
const message_feedback_admin_mapper_1 = require("./message-feedback-admin.mapper");
const message_feedback_admin_types_1 = require("./message-feedback-admin.types");
let MessageFeedbackAdminService = class MessageFeedbackAdminService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    listDownReasonTags() {
        return { items: [...message_feedback_constants_1.MESSAGE_FEEDBACK_DOWN_REASON_TAGS] };
    }
    async findPage(appClientId, query) {
        await this.assertAppClientExists(appClientId);
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.pageSize);
        const where = this.buildWhere(appClientId, query);
        const orderBy = this.buildOrderBy(query.orderBy, query.order);
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.messageFeedback.findMany({
                where,
                orderBy,
                skip,
                take,
                include: message_feedback_admin_types_1.MESSAGE_FEEDBACK_ADMIN_INCLUDE,
            }),
            this.prisma.messageFeedback.count({ where }),
        ]);
        const agentNameById = await this.loadAgentNames(appClientId, rows.map((row) => row.agentId));
        return (0, pagination_1.toPaginatedResult)((0, message_feedback_admin_mapper_1.toMessageFeedbackAdminListItems)(rows, agentNameById), total, page, pageSize);
    }
    async findPageBySession(appClientId, sessionId, query) {
        return this.findPage(appClientId, Object.assign(Object.assign({}, query), { sessionId: sessionId.trim() }));
    }
    async findOne(appClientId, id) {
        await this.assertAppClientExists(appClientId);
        const row = await this.prisma.messageFeedback.findFirst({
            where: { id, appClientId },
            include: message_feedback_admin_types_1.MESSAGE_FEEDBACK_ADMIN_INCLUDE,
        });
        if (!row) {
            throw new common_1.NotFoundException(`messageFeedback ${id} not found`);
        }
        const agentNameById = await this.loadAgentNames(appClientId, [row.agentId]);
        return (0, message_feedback_admin_mapper_1.toMessageFeedbackAdminListItem)(row, agentNameById);
    }
    async getSummary(appClientId, days = 7) {
        var _a, _b;
        await this.assertAppClientExists(appClientId);
        const windowDays = Number.isFinite(days) && days > 0 ? Math.floor(days) : 7;
        const from = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
        const to = new Date();
        const baseWhere = {
            appClientId,
            createdAt: { gte: from, lte: to },
        };
        const [total, up, downRows] = await Promise.all([
            this.prisma.messageFeedback.count({ where: baseWhere }),
            this.prisma.messageFeedback.count({
                where: Object.assign(Object.assign({}, baseWhere), { rating: 'up' }),
            }),
            this.prisma.messageFeedback.findMany({
                where: Object.assign(Object.assign({}, baseWhere), { rating: 'down' }),
                select: { reasonTags: true, agentId: true },
            }),
        ]);
        const down = downRows.length;
        const tagCounts = new Map();
        const agentDownCounts = new Map();
        for (const row of downRows) {
            const tags = Array.isArray(row.reasonTags)
                ? row.reasonTags.filter((item) => typeof item === 'string')
                : [];
            for (const tag of tags) {
                tagCounts.set(tag, ((_a = tagCounts.get(tag)) !== null && _a !== void 0 ? _a : 0) + 1);
            }
            if (row.agentId != null) {
                agentDownCounts.set(row.agentId, ((_b = agentDownCounts.get(row.agentId)) !== null && _b !== void 0 ? _b : 0) + 1);
            }
        }
        const agentIds = [...agentDownCounts.keys()];
        const agentNameById = await this.loadAgentNames(appClientId, agentIds);
        return {
            windowDays,
            from: from.toISOString(),
            to: to.toISOString(),
            totals: {
                feedback: total,
                up,
                down,
                upRate: total > 0 ? up / total : 0,
            },
            downReasonTagCounts: message_feedback_constants_1.MESSAGE_FEEDBACK_DOWN_REASON_TAGS.map((tag) => {
                var _a;
                return ({
                    key: tag.key,
                    label: tag.label,
                    count: (_a = tagCounts.get(tag.key)) !== null && _a !== void 0 ? _a : 0,
                });
            }).filter((row) => row.count > 0),
            downByAgent: agentIds
                .map((agentId) => {
                var _a, _b;
                return ({
                    agentId,
                    agentName: (_a = agentNameById.get(agentId)) !== null && _a !== void 0 ? _a : `Agent#${agentId}`,
                    downCount: (_b = agentDownCounts.get(agentId)) !== null && _b !== void 0 ? _b : 0,
                });
            })
                .sort((a, b) => b.downCount - a.downCount),
        };
    }
    buildWhere(appClientId, query) {
        var _a, _b, _c;
        const where = { appClientId };
        if (query.id != null) {
            where.id = query.id;
        }
        if (query.rating != null) {
            where.rating = query.rating;
        }
        if (query.agentId != null) {
            where.agentId = query.agentId;
        }
        if (query.userId != null) {
            where.userId = query.userId;
        }
        if ((_a = query.sessionId) === null || _a === void 0 ? void 0 : _a.trim()) {
            where.sessionId = query.sessionId.trim();
        }
        if (query.messageId != null) {
            where.messageId = query.messageId;
        }
        if (query.turnId != null) {
            where.turnId = query.turnId;
        }
        if ((_b = query.reasonTag) === null || _b === void 0 ? void 0 : _b.trim()) {
            const tag = query.reasonTag.trim();
            if (!(0, message_feedback_constants_1.isAllowedDownReasonTagKey)(tag)) {
                where.id = -1;
            }
            else {
                where.reasonTags = {
                    string_contains: `"${tag}"`,
                };
            }
        }
        if ((_c = query.commentKeyword) === null || _c === void 0 ? void 0 : _c.trim()) {
            where.comment = {
                contains: query.commentKeyword.trim(),
                mode: 'insensitive',
            };
        }
        return where;
    }
    buildOrderBy(orderBy, order) {
        const field = orderBy !== null && orderBy !== void 0 ? orderBy : 'id';
        return { [field]: (0, pagination_1.resolveSortOrder)(order) };
    }
    async loadAgentNames(appClientId, agentIds) {
        const ids = [...new Set(agentIds.filter((id) => id != null))];
        if (ids.length === 0) {
            return new Map();
        }
        const rows = await this.prisma.agent.findMany({
            where: { appClientId, id: { in: ids } },
            select: { id: true, name: true },
        });
        return new Map(rows.map((row) => [row.id, row.name]));
    }
    async assertAppClientExists(appClientId) {
        const row = await this.prisma.appClient.findUnique({
            where: { id: appClientId },
            select: { id: true },
        });
        if (!row) {
            throw new common_1.NotFoundException(`appClient ${appClientId} not found`);
        }
    }
};
MessageFeedbackAdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MessageFeedbackAdminService);
exports.MessageFeedbackAdminService = MessageFeedbackAdminService;
//# sourceMappingURL=message-feedback-admin.service.js.map