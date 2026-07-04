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
exports.MessageTurnService = void 0;
const common_1 = require("@nestjs/common");
const pagination_1 = require("../../common/pagination");
const prisma_service_1 = require("../../prisma/prisma.service");
const message_turn_mapper_1 = require("./message-turn.mapper");
const message_turn_types_1 = require("./message-turn.types");
let MessageTurnService = class MessageTurnService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findPage(query) {
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.pageSize);
        const where = this.buildWhere(query);
        const orderBy = this.buildOrderBy(query.orderBy, query.order);
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.messageTurn.findMany({
                where,
                orderBy,
                skip,
                take,
                include: message_turn_types_1.MESSAGE_TURN_DETAIL_INCLUDE,
            }),
            this.prisma.messageTurn.count({ where }),
        ]);
        return (0, pagination_1.toPaginatedResult)((0, message_turn_mapper_1.toMessageTurnResponseList)(rows), total, page, pageSize);
    }
    async findPageBySessionId(sessionId, query) {
        return this.findPage(Object.assign(Object.assign({}, query), { sessionId }));
    }
    async findOne(id) {
        const row = await this.prisma.messageTurn.findUnique({
            where: { id },
            include: message_turn_types_1.MESSAGE_TURN_DETAIL_INCLUDE,
        });
        if (!row) {
            throw new common_1.NotFoundException(`messageTurn ${id} not found`);
        }
        return (0, message_turn_mapper_1.toMessageTurnResponse)(row);
    }
    buildWhere(query) {
        var _a, _b, _c;
        const where = {};
        if (query.id != null) {
            where.id = query.id;
        }
        if (query.messageId != null) {
            where.messageId = query.messageId;
        }
        if ((_a = query.sessionId) === null || _a === void 0 ? void 0 : _a.trim()) {
            where.sessionId = query.sessionId.trim();
        }
        if (query.userId != null) {
            where.userId = query.userId;
        }
        if (query.appClientId != null) {
            where.appClientId = query.appClientId;
        }
        if (query.primaryAgentId != null) {
            where.primaryAgentId = query.primaryAgentId;
        }
        if (query.status != null) {
            where.status = query.status;
        }
        if ((_b = query.userInput) === null || _b === void 0 ? void 0 : _b.trim()) {
            where.userInput = {
                contains: query.userInput.trim(),
                mode: 'insensitive',
            };
        }
        if ((_c = query.keyword) === null || _c === void 0 ? void 0 : _c.trim()) {
            const keyword = query.keyword.trim();
            where.OR = [
                { userInput: { contains: keyword, mode: 'insensitive' } },
                { finalOutput: { contains: keyword, mode: 'insensitive' } },
            ];
        }
        if (query.minLowQualityCount != null) {
            where.AND = [
                ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
                {
                    toolsUsed: {
                        path: ['qualityCounts', 'low'],
                        gte: query.minLowQualityCount,
                    },
                },
            ];
        }
        return where;
    }
    buildOrderBy(orderBy, order) {
        const direction = (0, pagination_1.resolveSortOrder)(order);
        switch (orderBy !== null && orderBy !== void 0 ? orderBy : 'id') {
            case 'createdAt':
                return { createdAt: direction };
            case 'updatedAt':
                return { updatedAt: direction };
            case 'startedAt':
                return { startedAt: direction };
            case 'finishedAt':
                return { finishedAt: direction };
            case 'durationMs':
                return { durationMs: direction };
            case 'totalTokens':
                return { totalTokens: direction };
            case 'id':
            default:
                return { id: direction };
        }
    }
};
MessageTurnService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MessageTurnService);
exports.MessageTurnService = MessageTurnService;
//# sourceMappingURL=message-turn.service.js.map