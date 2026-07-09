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
exports.ToolCategoryService = void 0;
const common_1 = require("@nestjs/common");
const pagination_1 = require("../../common/pagination");
const runtime_cache_invalidator_service_1 = require("../../core/runtime-cache/runtime-cache-invalidator.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const tool_category_mapper_1 = require("./tool-category.mapper");
const tool_category_types_1 = require("./tool-category.types");
let ToolCategoryService = class ToolCategoryService {
    constructor(prisma, runtimeCacheInvalidator) {
        this.prisma = prisma;
        this.runtimeCacheInvalidator = runtimeCacheInvalidator;
    }
    async create(dto) {
        var _a;
        const label = dto.label.trim();
        if (!label) {
            throw new common_1.BadRequestException('label is required');
        }
        const row = await this.prisma.toolCategory.create({
            data: {
                label,
                description: this.normalizeOptionalText(dto.description),
                sortOrder: (_a = dto.sortOrder) !== null && _a !== void 0 ? _a : 0,
            },
            include: tool_category_types_1.TOOL_CATEGORY_DETAIL_INCLUDE,
        });
        return (0, tool_category_mapper_1.toToolCategoryResponse)(row);
    }
    async findPage(query) {
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.pageSize);
        const where = this.buildWhere(query);
        const orderBy = this.buildOrderBy(query.orderBy, query.order);
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.toolCategory.findMany({
                where,
                orderBy,
                skip,
                take,
                include: tool_category_types_1.TOOL_CATEGORY_DETAIL_INCLUDE,
            }),
            this.prisma.toolCategory.count({ where }),
        ]);
        return (0, pagination_1.toPaginatedResult)((0, tool_category_mapper_1.toToolCategoryResponseList)(rows), total, page, pageSize);
    }
    async findOne(id) {
        const row = await this.prisma.toolCategory.findUnique({
            where: { id },
            include: tool_category_types_1.TOOL_CATEGORY_DETAIL_INCLUDE,
        });
        if (!row) {
            throw new common_1.NotFoundException(`toolCategory ${id} not found`);
        }
        return (0, tool_category_mapper_1.toToolCategoryResponse)(row);
    }
    async update(id, dto) {
        var _a;
        await this.findOne(id);
        if (dto.label !== undefined && !dto.label.trim()) {
            throw new common_1.BadRequestException('label cannot be empty');
        }
        const row = await this.prisma.toolCategory.update({
            where: { id },
            data: {
                label: (_a = dto.label) === null || _a === void 0 ? void 0 : _a.trim(),
                description: dto.description === undefined
                    ? undefined
                    : this.normalizeOptionalText(dto.description),
                sortOrder: dto.sortOrder,
            },
            include: tool_category_types_1.TOOL_CATEGORY_DETAIL_INCLUDE,
        });
        this.runtimeCacheInvalidator.invalidateToolCategories();
        return (0, tool_category_mapper_1.toToolCategoryResponse)(row);
    }
    async remove(id) {
        var _a, _b;
        const row = await this.findOne(id);
        if (((_b = (_a = row._count) === null || _a === void 0 ? void 0 : _a.tools) !== null && _b !== void 0 ? _b : 0) > 0) {
            throw new common_1.BadRequestException(`toolCategory ${id} has bound tools, unbind tools before deleting`);
        }
        await this.prisma.toolCategory.delete({ where: { id } });
        this.runtimeCacheInvalidator.invalidateToolCategories();
        return row;
    }
    buildWhere(query) {
        var _a, _b;
        const where = {};
        if (query.id != null) {
            where.id = query.id;
        }
        if ((_a = query.label) === null || _a === void 0 ? void 0 : _a.trim()) {
            where.label = { contains: query.label.trim(), mode: 'insensitive' };
        }
        if ((_b = query.keyword) === null || _b === void 0 ? void 0 : _b.trim()) {
            const keyword = query.keyword.trim();
            where.OR = [
                { label: { contains: keyword, mode: 'insensitive' } },
                { description: { contains: keyword, mode: 'insensitive' } },
            ];
        }
        return where;
    }
    buildOrderBy(orderBy, order) {
        const direction = (0, pagination_1.resolveSortOrder)(order);
        switch (orderBy !== null && orderBy !== void 0 ? orderBy : 'sortOrder') {
            case 'id':
                return { id: direction };
            case 'label':
                return { label: direction };
            case 'createdAt':
                return { createdAt: direction };
            case 'updatedAt':
                return { updatedAt: direction };
            case 'sortOrder':
            default:
                return { sortOrder: direction };
        }
    }
    normalizeOptionalText(value) {
        if (value == null) {
            return null;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
};
ToolCategoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        runtime_cache_invalidator_service_1.RuntimeCacheInvalidator])
], ToolCategoryService);
exports.ToolCategoryService = ToolCategoryService;
//# sourceMappingURL=tool-category.service.js.map