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
exports.PageActionService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../generated/prisma/client");
const pagination_1 = require("../../common/pagination");
const page_action_prompt_limits_util_1 = require("../../core/page-action/page-action-prompt-limits.util");
const prisma_service_1 = require("../../prisma/prisma.service");
const host_tool_types_1 = require("../host-tool/host-tool.types");
const page_action_mapper_1 = require("./page-action.mapper");
const page_action_types_1 = require("./page-action.types");
const workflow_service_1 = require("../workflow/workflow.service");
let PageActionService = class PageActionService {
    constructor(prisma, workflowService) {
        this.prisma = prisma;
        this.workflowService = workflowService;
    }
    async create(dto) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        await this.assertAppClientExists(dto.appClientId);
        this.assertInlineStreamOnly(dto.defaultDelivery);
        const actionKey = dto.actionKey.trim();
        (0, page_action_prompt_limits_util_1.assertPageActionPromptLimits)({ systemPrompt: dto.systemPrompt });
        if (dto.hostToolId != null) {
            await this.assertHostToolForApp(dto.appClientId, dto.hostToolId);
        }
        const hostToolId = (_a = dto.hostToolId) !== null && _a !== void 0 ? _a : null;
        if (dto.workflowId != null && dto.workflowId > 0) {
            await this.workflowService.assertWorkflowReferenceCompatible({
                workflowId: dto.workflowId,
                appClientId: dto.appClientId,
                entry: 'page_action',
            });
            await this.workflowService.assertPageActionWorkflowBindingsCompatible({
                workflowId: dto.workflowId,
                appClientId: dto.appClientId,
                workflowVersion: dto.workflowVersion,
                pageActionHostToolId: hostToolId,
            });
        }
        try {
            const row = await this.prisma.pageAction.create({
                data: {
                    appClientId: dto.appClientId,
                    actionKey,
                    name: dto.name.trim(),
                    description: ((_b = dto.description) === null || _b === void 0 ? void 0 : _b.trim()) || null,
                    hostToolId,
                    pageScope: ((_c = dto.pageScope) === null || _c === void 0 ? void 0 : _c.trim()) || null,
                    systemPrompt: dto.systemPrompt.trim(),
                    defaultDelivery: client_1.PageActionDelivery.inline_stream,
                    allowCustomInstruction: (_d = dto.allowCustomInstruction) !== null && _d !== void 0 ? _d : true,
                    isActive: (_e = dto.isActive) !== null && _e !== void 0 ? _e : true,
                    sortOrder: (_f = dto.sortOrder) !== null && _f !== void 0 ? _f : 0,
                    config: dto.config === undefined
                        ? undefined
                        : dto.config,
                    sourceSkillId: (_g = dto.sourceSkillId) !== null && _g !== void 0 ? _g : null,
                    workflowId: (_h = dto.workflowId) !== null && _h !== void 0 ? _h : undefined,
                    workflowVersion: (_j = dto.workflowVersion) !== null && _j !== void 0 ? _j : undefined,
                    workflowOverrides: dto.workflowOverrides === undefined
                        ? undefined
                        : dto.workflowOverrides === null
                            ? client_1.Prisma.JsonNull
                            : dto.workflowOverrides,
                },
                include: page_action_types_1.PAGE_ACTION_DETAIL_INCLUDE,
            });
            return (0, page_action_mapper_1.toPageActionResponse)(row);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException(`PageAction actionKey "${actionKey}" already exists for this AppClient`);
            }
            throw error;
        }
    }
    async update(id, dto) {
        var _a, _b;
        this.assertInlineStreamOnly(dto.defaultDelivery);
        const existing = await this.findEntityOrThrow(id);
        if (dto.hostToolId != null) {
            await this.assertHostToolForApp(existing.appClientId, dto.hostToolId);
        }
        if (dto.systemPrompt != null) {
            (0, page_action_prompt_limits_util_1.assertPageActionPromptLimits)({ systemPrompt: dto.systemPrompt });
        }
        if (dto.workflowId != null) {
            await this.workflowService.assertWorkflowReferenceCompatible({
                workflowId: dto.workflowId,
                appClientId: existing.appClientId,
                entry: 'page_action',
            });
        }
        const nextWorkflowId = dto.workflowId !== undefined ? dto.workflowId : existing.workflowId;
        const nextWorkflowVersion = dto.workflowVersion !== undefined
            ? dto.workflowVersion
            : existing.workflowVersion;
        const nextHostToolId = dto.hostToolId !== undefined ? dto.hostToolId : existing.hostToolId;
        if (nextWorkflowId != null && nextWorkflowId > 0) {
            await this.workflowService.assertPageActionWorkflowBindingsCompatible({
                workflowId: nextWorkflowId,
                appClientId: existing.appClientId,
                workflowVersion: nextWorkflowVersion,
                pageActionHostToolId: nextHostToolId,
            });
        }
        const row = await this.prisma.pageAction.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (dto.name != null ? { name: dto.name.trim() } : {})), (dto.description !== undefined
                ? { description: ((_a = dto.description) === null || _a === void 0 ? void 0 : _a.trim()) || null }
                : {})), (dto.hostToolId !== undefined ? { hostToolId: dto.hostToolId } : {})), (dto.pageScope !== undefined
                ? { pageScope: ((_b = dto.pageScope) === null || _b === void 0 ? void 0 : _b.trim()) || null }
                : {})), (dto.systemPrompt != null
                ? { systemPrompt: dto.systemPrompt.trim() }
                : {})), (dto.defaultDelivery != null
                ? { defaultDelivery: client_1.PageActionDelivery.inline_stream }
                : {})), (dto.allowCustomInstruction != null
                ? { allowCustomInstruction: dto.allowCustomInstruction }
                : {})), (dto.isActive != null ? { isActive: dto.isActive } : {})), (dto.sortOrder != null ? { sortOrder: dto.sortOrder } : {})), (dto.config !== undefined
                ? { config: dto.config }
                : {})), (dto.workflowId !== undefined ? { workflowId: dto.workflowId } : {})), (dto.workflowVersion !== undefined
                ? { workflowVersion: dto.workflowVersion }
                : {})), (dto.workflowOverrides !== undefined
                ? {
                    workflowOverrides: dto.workflowOverrides === null
                        ? client_1.Prisma.JsonNull
                        : dto.workflowOverrides,
                }
                : {})),
            include: page_action_types_1.PAGE_ACTION_DETAIL_INCLUDE,
        });
        return (0, page_action_mapper_1.toPageActionResponse)(row);
    }
    async findOne(id) {
        const row = await this.findEntityOrThrow(id);
        return (0, page_action_mapper_1.toPageActionResponse)(row);
    }
    async remove(id) {
        await this.findEntityOrThrow(id);
        await this.prisma.pageAction.delete({ where: { id } });
        return { ok: true, id };
    }
    async listPageScopes(appClientId, query = {}) {
        var _a;
        await this.assertAppClientExists(appClientId);
        const activeOnly = query.activeOnly !== false;
        const hostPages = await this.prisma.hostPage.findMany({
            where: Object.assign({ appClientId }, (activeOnly ? { isActive: true } : {})),
            select: { scope: true, label: true, isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { scope: 'asc' }],
        });
        const scopeMap = new Map();
        for (const row of hostPages) {
            scopeMap.set(row.scope, {
                scope: row.scope,
                label: row.label,
                isActive: row.isActive,
            });
        }
        const actionScopes = await this.prisma.pageAction.findMany({
            where: { appClientId, pageScope: { not: null } },
            select: { pageScope: true },
            distinct: ['pageScope'],
        });
        for (const row of actionScopes) {
            const scope = (_a = row.pageScope) === null || _a === void 0 ? void 0 : _a.trim();
            if (!scope || scopeMap.has(scope)) {
                continue;
            }
            scopeMap.set(scope, {
                scope,
                label: null,
                isActive: true,
            });
        }
        return [...scopeMap.values()].sort((a, b) => a.scope.localeCompare(b.scope));
    }
    async findPage(query) {
        var _a, _b;
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.pageSize);
        const where = Object.assign(Object.assign(Object.assign(Object.assign({}, (query.appClientId != null ? { appClientId: query.appClientId } : {})), (((_a = query.pageScope) === null || _a === void 0 ? void 0 : _a.trim())
            ? { pageScope: query.pageScope.trim() }
            : {})), (query.isActive != null ? { isActive: query.isActive } : {})), (((_b = query.keyword) === null || _b === void 0 ? void 0 : _b.trim())
            ? {
                OR: [
                    { actionKey: { contains: query.keyword.trim() } },
                    { name: { contains: query.keyword.trim() } },
                ],
            }
            : {}));
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.pageAction.findMany({
                where,
                skip,
                take,
                orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
                include: page_action_types_1.PAGE_ACTION_DETAIL_INCLUDE,
            }),
            this.prisma.pageAction.count({ where }),
        ]);
        return (0, pagination_1.toPaginatedResult)(rows.map(page_action_mapper_1.toPageActionResponse), total, page, pageSize);
    }
    async findRunAdmin(id) {
        const run = await this.prisma.pageActionRun.findUnique({
            where: { id },
            include: page_action_types_1.PAGE_ACTION_RUN_ADMIN_INCLUDE,
        });
        if (!run) {
            throw new common_1.NotFoundException(`PageActionRun ${id} not found`);
        }
        return (0, page_action_mapper_1.toPageActionRunAdminDetail)(run);
    }
    async findRunPageAdmin(appClientId, query) {
        var _a, _b;
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.pageSize);
        const where = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ appClientId }, (query.pageActionId != null ? { pageActionId: query.pageActionId } : {})), (query.userId != null ? { userId: query.userId } : {})), (query.status != null ? { status: query.status } : {})), (((_a = query.clientActionId) === null || _a === void 0 ? void 0 : _a.trim())
            ? { clientActionId: query.clientActionId.trim() }
            : {})), (((_b = query.actionKey) === null || _b === void 0 ? void 0 : _b.trim())
            ? {
                pageAction: {
                    actionKey: { contains: query.actionKey.trim() },
                },
            }
            : {}));
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.pageActionRun.findMany({
                where,
                skip,
                take,
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                include: page_action_types_1.PAGE_ACTION_RUN_ADMIN_INCLUDE,
            }),
            this.prisma.pageActionRun.count({ where }),
        ]);
        return (0, pagination_1.toPaginatedResult)(rows.map(page_action_mapper_1.toPageActionRunAdminListItem), total, page, pageSize);
    }
    assertInlineStreamOnly(delivery) {
        if (delivery != null && delivery !== client_1.PageActionDelivery.inline_stream) {
            throw new common_1.BadRequestException({
                code: 'DELIVERY_NOT_SUPPORTED',
                message: 'only inline_stream is supported; sync has been removed',
            });
        }
    }
    async findEntityOrThrow(id) {
        const row = await this.prisma.pageAction.findUnique({
            where: { id },
            include: page_action_types_1.PAGE_ACTION_DETAIL_INCLUDE,
        });
        if (!row) {
            throw new common_1.NotFoundException(`PageAction ${id} not found`);
        }
        return row;
    }
    async assertAppClientExists(appClientId) {
        const row = await this.prisma.appClient.findUnique({
            where: { id: appClientId },
            select: { id: true },
        });
        if (!row) {
            throw new common_1.NotFoundException(`AppClient ${appClientId} not found`);
        }
    }
    async assertHostToolForApp(appClientId, hostToolId) {
        const row = await this.prisma.hostTool.findFirst({
            where: { id: hostToolId, appClientId },
            include: host_tool_types_1.HOST_TOOL_DETAIL_INCLUDE,
        });
        if (!row) {
            throw new common_1.NotFoundException({
                code: 'HOST_TOOL_NOT_FOUND',
                message: `HostTool ${hostToolId} not found for AppClient ${appClientId}`,
            });
        }
    }
};
PageActionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        workflow_service_1.WorkflowService])
], PageActionService);
exports.PageActionService = PageActionService;
//# sourceMappingURL=page-action.service.js.map