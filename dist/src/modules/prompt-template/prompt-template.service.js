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
exports.PromptTemplateService = void 0;
const common_1 = require("@nestjs/common");
const pagination_1 = require("../../common/pagination");
const prompt_template_catalog_1 = require("../../core/prompt/prompt-template.catalog");
const prompt_registry_service_1 = require("../../core/prompt/prompt-registry.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let PromptTemplateService = class PromptTemplateService {
    constructor(prisma, promptRegistry) {
        this.prisma = prisma;
        this.promptRegistry = promptRegistry;
    }
    listCreatableKeys() {
        return { keys: (0, prompt_template_catalog_1.listCreatablePromptTemplateKeys)() };
    }
    async findPage(query) {
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.pageSize);
        const where = this.buildWhere(query);
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.promptTemplate.findMany({
                where,
                orderBy: [
                    { key: 'asc' },
                    { appClientId: 'asc' },
                    { agentId: 'asc' },
                    { version: 'desc' },
                ],
                skip,
                take,
            }),
            this.prisma.promptTemplate.count({ where }),
        ]);
        return (0, pagination_1.toPaginatedResult)(rows, total, page, pageSize);
    }
    async findOne(id) {
        const row = await this.prisma.promptTemplate.findUnique({ where: { id } });
        if (!row) {
            throw new common_1.NotFoundException(`prompt template ${id} not found`);
        }
        return row;
    }
    async createVersion(dto) {
        var _a, _b, _c, _d, _e, _f, _g;
        const key = dto.key.trim();
        if (!(0, prompt_template_catalog_1.isAllowedPromptTemplateKey)(key)) {
            throw new common_1.BadRequestException(`prompt key "${key}" is not allowed; use GET /prompt-template/keys`);
        }
        const locale = ((_a = dto.locale) === null || _a === void 0 ? void 0 : _a.trim()) || 'zh-CN';
        const appClientId = (_b = dto.appClientId) !== null && _b !== void 0 ? _b : null;
        const agentId = (_c = dto.agentId) !== null && _c !== void 0 ? _c : null;
        if (agentId != null && appClientId == null) {
            throw new common_1.BadRequestException('agentId requires appClientId for scoped prompts');
        }
        if (appClientId != null) {
            await this.assertAppClientExists(appClientId);
        }
        if (agentId != null) {
            await this.assertAgentExists(agentId, appClientId);
        }
        const catalog = (0, prompt_template_catalog_1.getPromptTemplateCatalogItem)(key);
        const max = await this.prisma.promptTemplate.aggregate({
            where: { key, appClientId, agentId, locale },
            _max: { version: true },
        });
        const version = ((_d = max._max.version) !== null && _d !== void 0 ? _d : 0) + 1;
        const row = await this.prisma.promptTemplate.create({
            data: {
                key,
                version,
                appClientId,
                agentId,
                locale,
                category: ((_e = dto.category) === null || _e === void 0 ? void 0 : _e.trim()) || (catalog === null || catalog === void 0 ? void 0 : catalog.category) || null,
                title: ((_f = dto.title) === null || _f === void 0 ? void 0 : _f.trim()) || (catalog === null || catalog === void 0 ? void 0 : catalog.title) || null,
                description: ((_g = dto.description) === null || _g === void 0 ? void 0 : _g.trim()) || (catalog === null || catalog === void 0 ? void 0 : catalog.description) || null,
                content: dto.content,
                isActive: false,
            },
        });
        if (dto.publish === true) {
            return this.publish(row.id);
        }
        return row;
    }
    async update(id, dto) {
        await this.findOne(id);
        const data = {};
        if (dto.content !== undefined) {
            const content = dto.content.trim();
            if (!content) {
                throw new common_1.BadRequestException('content must not be empty');
            }
            data.content = content;
        }
        if (dto.category !== undefined) {
            data.category = dto.category.trim() || null;
        }
        if (dto.title !== undefined) {
            data.title = dto.title.trim() || null;
        }
        if (dto.description !== undefined) {
            data.description = dto.description.trim() || null;
        }
        if (Object.keys(data).length === 0) {
            throw new common_1.BadRequestException('at least one field is required to update');
        }
        const updated = await this.prisma.promptTemplate.update({
            where: { id },
            data,
        });
        if (updated.isActive) {
            await this.promptRegistry.syncActiveRowToRedis(updated);
        }
        return updated;
    }
    async remove(id) {
        const row = await this.findOne(id);
        if (row.isActive) {
            throw new common_1.BadRequestException('cannot delete an active prompt template; publish another version first');
        }
        const scopeWhere = this.scopeWhere(row);
        const versionCount = await this.prisma.promptTemplate.count({
            where: scopeWhere,
        });
        if (versionCount <= 1) {
            throw new common_1.BadRequestException('cannot delete the last version for this key and scope; at least one version must remain');
        }
        await this.prisma.promptTemplate.delete({ where: { id } });
        return { deleted: row };
    }
    async publish(id) {
        const row = await this.findOne(id);
        await this.prisma.$transaction([
            this.prisma.promptTemplate.updateMany({
                where: {
                    key: row.key,
                    appClientId: row.appClientId,
                    agentId: row.agentId,
                    locale: row.locale,
                    isActive: true,
                },
                data: { isActive: false },
            }),
            this.prisma.promptTemplate.update({
                where: { id },
                data: { isActive: true },
            }),
        ]);
        const published = await this.findOne(id);
        await this.promptRegistry.syncActiveRowToRedis(published);
        return published;
    }
    async previewResolve(key, scope, variables) {
        const resolved = await this.promptRegistry.resolve(key, scope);
        const content = await this.promptRegistry.render(key, scope, variables !== null && variables !== void 0 ? variables : {});
        return { content, resolved };
    }
    scopeWhere(row) {
        return {
            key: row.key,
            appClientId: row.appClientId,
            agentId: row.agentId,
            locale: row.locale,
        };
    }
    buildWhere(query) {
        var _a, _b;
        const where = {};
        if ((_a = query.key) === null || _a === void 0 ? void 0 : _a.trim()) {
            where.key = { contains: query.key.trim(), mode: 'insensitive' };
        }
        if (query.appClientId != null) {
            where.appClientId = query.appClientId;
        }
        if (query.agentId != null) {
            where.agentId = query.agentId;
        }
        if ((_b = query.locale) === null || _b === void 0 ? void 0 : _b.trim()) {
            where.locale = query.locale.trim();
        }
        if (query.isActive != null) {
            where.isActive = query.isActive;
        }
        return where;
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
    async assertAgentExists(agentId, appClientId) {
        const row = await this.prisma.agent.findFirst({
            where: Object.assign({ id: agentId }, (appClientId != null ? { appClientId } : {})),
            select: { id: true },
        });
        if (!row) {
            throw new common_1.BadRequestException(`agent ${agentId} not found`);
        }
    }
};
PromptTemplateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        prompt_registry_service_1.PromptRegistryService])
], PromptTemplateService);
exports.PromptTemplateService = PromptTemplateService;
//# sourceMappingURL=prompt-template.service.js.map