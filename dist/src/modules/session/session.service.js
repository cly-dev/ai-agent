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
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const pagination_1 = require("../../common/pagination");
const prisma_service_1 = require("../../prisma/prisma.service");
const session_mapper_1 = require("./session.mapper");
const session_types_1 = require("./session.types");
let SessionService = class SessionService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(appClientId, dto) {
        var _a, _b, _c;
        await this.assertAppClientExists(appClientId);
        await this.assertUserExists(dto.userId);
        if (dto.agentId != null) {
            await this.assertAgentBelongsToApp(dto.agentId, appClientId);
        }
        const id = this.normalizeSessionId((_a = dto.id) !== null && _a !== void 0 ? _a : (0, crypto_1.randomBytes)(16).toString('hex'));
        const row = await this.prisma.session.create({
            data: {
                id,
                userId: dto.userId,
                appClientId,
                agentId: (_b = dto.agentId) !== null && _b !== void 0 ? _b : null,
                title: (_c = dto.title) !== null && _c !== void 0 ? _c : null,
            },
            include: session_types_1.SESSION_DETAIL_INCLUDE,
        });
        return (0, session_mapper_1.toSessionResponse)(row);
    }
    async findPage(appClientId, query) {
        await this.assertAppClientExists(appClientId);
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.pageSize);
        const where = this.buildWhere(appClientId, query);
        const orderBy = this.buildOrderBy(query.orderBy, query.order);
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.session.findMany({
                where,
                orderBy,
                skip,
                take,
                include: session_types_1.SESSION_DETAIL_INCLUDE,
            }),
            this.prisma.session.count({ where }),
        ]);
        return (0, pagination_1.toPaginatedResult)((0, session_mapper_1.toSessionResponseList)(rows), total, page, pageSize);
    }
    async findOneById(id) {
        const normalizedId = this.normalizeSessionId(id);
        const row = await this.prisma.session.findUnique({
            where: { id: normalizedId },
            include: session_types_1.SESSION_DETAIL_INCLUDE,
        });
        if (!row) {
            throw new common_1.NotFoundException(`session ${normalizedId} not found`);
        }
        return (0, session_mapper_1.toSessionResponse)(row);
    }
    async findOne(appClientId, id) {
        await this.assertAppClientExists(appClientId);
        const normalizedId = this.normalizeSessionId(id);
        const row = await this.prisma.session.findFirst({
            where: { id: normalizedId, appClientId },
            include: session_types_1.SESSION_DETAIL_INCLUDE,
        });
        if (!row) {
            throw new common_1.NotFoundException(`session ${normalizedId} not found under appClient ${appClientId}`);
        }
        return (0, session_mapper_1.toSessionResponse)(row);
    }
    async update(appClientId, id, dto) {
        const existing = await this.findOne(appClientId, id);
        if (dto.userId != null) {
            await this.assertUserExists(dto.userId);
        }
        if (dto.agentId != null) {
            await this.assertAgentBelongsToApp(dto.agentId, appClientId);
        }
        const row = await this.prisma.session.update({
            where: { id: existing.id },
            data: {
                userId: dto.userId,
                agentId: dto.agentId,
                title: dto.title,
            },
            include: session_types_1.SESSION_DETAIL_INCLUDE,
        });
        return (0, session_mapper_1.toSessionResponse)(row);
    }
    async remove(appClientId, id) {
        const existing = await this.findOne(appClientId, id);
        await this.prisma.session.delete({ where: { id: existing.id } });
        return existing;
    }
    buildWhere(appClientId, query) {
        var _a, _b, _c;
        const where = { appClientId };
        if ((_a = query.id) === null || _a === void 0 ? void 0 : _a.trim()) {
            where.id = this.normalizeSessionId(query.id);
        }
        if (query.userId != null) {
            where.userId = query.userId;
        }
        if (query.agentId != null) {
            where.agentId = query.agentId;
        }
        if ((_b = query.title) === null || _b === void 0 ? void 0 : _b.trim()) {
            where.title = { contains: query.title.trim(), mode: 'insensitive' };
        }
        if ((_c = query.keyword) === null || _c === void 0 ? void 0 : _c.trim()) {
            const keyword = query.keyword.trim();
            where.OR = [
                { id: { contains: keyword, mode: 'insensitive' } },
                { title: { contains: keyword, mode: 'insensitive' } },
            ];
        }
        return where;
    }
    buildOrderBy(orderBy, order) {
        const direction = (0, pagination_1.resolveSortOrder)(order);
        switch (orderBy !== null && orderBy !== void 0 ? orderBy : 'createdAt') {
            case 'id':
                return { id: direction };
            case 'updatedAt':
                return { createdAt: direction };
            case 'userId':
                return { userId: direction };
            case 'agentId':
                return { agentId: direction };
            case 'createdAt':
            default:
                return { createdAt: direction };
        }
    }
    normalizeSessionId(id) {
        return id.trim().toLowerCase();
    }
    async assertAppClientExists(appClientId) {
        const row = await this.prisma.appClient.findUnique({
            where: { id: appClientId },
            select: { id: true },
        });
        if (!row) {
            throw new common_1.BadRequestException(`appClient ${appClientId} not found`);
        }
    }
    async assertUserExists(userId) {
        const row = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!row) {
            throw new common_1.BadRequestException(`user ${userId} not found`);
        }
    }
    async assertAgentBelongsToApp(agentId, appClientId) {
        const row = await this.prisma.agent.findFirst({
            where: { id: agentId, appClientId },
            select: { id: true },
        });
        if (!row) {
            throw new common_1.BadRequestException(`agent ${agentId} not found under appClient ${appClientId}`);
        }
    }
};
SessionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SessionService);
exports.SessionService = SessionService;
//# sourceMappingURL=session.service.js.map