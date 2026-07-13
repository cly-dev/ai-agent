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
exports.RoleService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../generated/prisma/client");
const pagination_1 = require("../../common/pagination");
const prisma_service_1 = require("../../prisma/prisma.service");
const role_mapper_1 = require("./role.mapper");
const role_types_1 = require("./role.types");
let RoleService = class RoleService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        var _a;
        const name = dto.name.trim();
        if (!name) {
            throw new common_1.BadRequestException('name is required');
        }
        try {
            const row = await this.prisma.role.create({
                data: {
                    name,
                    description: this.normalizeOptionalText(dto.description),
                    allowToolLevel: (_a = dto.allowToolLevel) !== null && _a !== void 0 ? _a : client_1.ToolLevel.L1,
                },
                include: role_types_1.ROLE_DETAIL_INCLUDE,
            });
            return (0, role_mapper_1.toRoleResponse)(row);
        }
        catch (error) {
            this.rethrowUniqueConflict(error, name);
            throw error;
        }
    }
    async findPage(query) {
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.pageSize);
        const where = this.buildWhere(query);
        const orderBy = this.buildOrderBy(query.orderBy, query.order);
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.role.findMany({
                where,
                orderBy,
                skip,
                take,
                include: role_types_1.ROLE_DETAIL_INCLUDE,
            }),
            this.prisma.role.count({ where }),
        ]);
        return (0, pagination_1.toPaginatedResult)((0, role_mapper_1.toRoleResponseList)(rows), total, page, pageSize);
    }
    async findOne(id) {
        const row = await this.prisma.role.findUnique({
            where: { id },
            include: role_types_1.ROLE_DETAIL_INCLUDE,
        });
        if (!row) {
            throw new common_1.NotFoundException(`role ${id} not found`);
        }
        return (0, role_mapper_1.toRoleResponse)(row);
    }
    async update(id, dto) {
        var _a;
        await this.findOne(id);
        if (dto.name !== undefined && !dto.name.trim()) {
            throw new common_1.BadRequestException('name cannot be empty');
        }
        try {
            const row = await this.prisma.role.update({
                where: { id },
                data: {
                    name: (_a = dto.name) === null || _a === void 0 ? void 0 : _a.trim(),
                    description: dto.description === undefined
                        ? undefined
                        : this.normalizeOptionalText(dto.description),
                    allowToolLevel: dto.allowToolLevel,
                },
                include: role_types_1.ROLE_DETAIL_INCLUDE,
            });
            return (0, role_mapper_1.toRoleResponse)(row);
        }
        catch (error) {
            if (dto.name) {
                this.rethrowUniqueConflict(error, dto.name.trim());
            }
            throw error;
        }
    }
    async remove(id) {
        const row = await this.findOne(id);
        if (row._count.userApps > 0) {
            throw new common_1.BadRequestException(`role ${id} is assigned to ${row._count.userApps} user app binding(s); reassign users before deleting`);
        }
        await this.prisma.role.delete({ where: { id } });
        return row;
    }
    buildWhere(query) {
        var _a, _b;
        const where = {};
        if (query.id != null) {
            where.id = query.id;
        }
        if ((_a = query.name) === null || _a === void 0 ? void 0 : _a.trim()) {
            where.name = { contains: query.name.trim(), mode: 'insensitive' };
        }
        if (query.allowToolLevel != null) {
            where.allowToolLevel = query.allowToolLevel;
        }
        if ((_b = query.keyword) === null || _b === void 0 ? void 0 : _b.trim()) {
            const keyword = query.keyword.trim();
            where.OR = [
                { name: { contains: keyword, mode: 'insensitive' } },
                { description: { contains: keyword, mode: 'insensitive' } },
            ];
        }
        return where;
    }
    buildOrderBy(orderBy, order) {
        const direction = (0, pagination_1.resolveSortOrder)(order);
        switch (orderBy !== null && orderBy !== void 0 ? orderBy : 'id') {
            case 'name':
                return { name: direction };
            case 'allowToolLevel':
                return { allowToolLevel: direction };
            case 'createdAt':
                return { createdAt: direction };
            case 'id':
            default:
                return { id: direction };
        }
    }
    normalizeOptionalText(value) {
        if (value == null) {
            return null;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    rethrowUniqueConflict(error, name) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002') {
            throw new common_1.ConflictException(`role name "${name}" already exists`);
        }
    }
};
RoleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RoleService);
exports.RoleService = RoleService;
//# sourceMappingURL=role.service.js.map