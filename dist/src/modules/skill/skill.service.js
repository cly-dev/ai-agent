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
exports.SkillService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../generated/prisma/client");
const pagination_1 = require("../../common/pagination");
const risk_level_util_1 = require("../../core/risk/risk-level.util");
const skill_runnable_util_1 = require("../../core/skill/skill-runnable.util");
const skill_service_1 = require("../../core/skill/skill.service");
const runtime_cache_invalidator_service_1 = require("../../core/runtime-cache/runtime-cache-invalidator.service");
const capability_candidate_util_1 = require("../../core/runtime-cache/capability-candidate.util");
const agent_capability_load_util_1 = require("../../core/runtime-cache/agent-capability-load.util");
const agent_host_tool_catalog_service_1 = require("../../core/runtime-cache/agent-host-tool-catalog.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const agent_service_1 = require("../agent/agent.service");
const workflow_service_1 = require("../workflow/workflow.service");
const skill_capability_key_util_1 = require("./util/skill-capability-key.util");
const skill_mapper_1 = require("./mapper/skill.mapper");
const skill_risk_util_1 = require("./util/skill-risk.util");
const skill_query_util_1 = require("./util/skill-query.util");
const skill_types_1 = require("./types/skill.types");
let SkillService = class SkillService {
    constructor(prisma, skillRuntime, agentService, runtimeCacheInvalidator, hostToolCatalogService, workflowService) {
        this.prisma = prisma;
        this.skillRuntime = skillRuntime;
        this.agentService = agentService;
        this.runtimeCacheInvalidator = runtimeCacheInvalidator;
        this.hostToolCatalogService = hostToolCatalogService;
        this.workflowService = workflowService;
    }
    async create(agentId, appClientId, dto) {
        await this.assertAgentInAppClient(agentId, appClientId);
        return this.createForAppClient(appClientId, dto, agentId);
    }
    async createForAppClient(appClientId, dto, linkAgentId) {
        var _a, _b, _c;
        await this.assertAppClientExists(appClientId);
        if (linkAgentId != null) {
            await this.assertAgentInAppClient(linkAgentId, appClientId);
        }
        const name = dto.name.trim();
        if (!name) {
            throw new common_1.BadRequestException('name is required');
        }
        const prompt = dto.prompt.trim();
        if (!prompt) {
            throw new common_1.BadRequestException('prompt is required');
        }
        const capabilityKey = (0, skill_capability_key_util_1.normalizeCapabilityKey)(dto.capabilityKey);
        const toolBindings = this.normalizeToolBindings(dto.tools);
        await this.assertToolsInApp(appClientId, toolBindings);
        const riskLevel = (0, skill_risk_util_1.resolveSkillRiskLevel)({
            explicit: dto.riskLevel,
            toolRiskLevels: await this.fetchToolRiskLevels(toolBindings.map((item) => item.toolId)),
        });
        if (dto.workflowId != null) {
            await this.workflowService.assertWorkflowReferenceCompatible({
                workflowId: dto.workflowId,
                appClientId,
                entry: 'skill',
            });
            await this.assertSkillWorkflowBindingsIfNeeded({
                workflowId: dto.workflowId,
                workflowVersion: dto.workflowVersion,
                appClientId,
                skillToolIds: toolBindings.map((item) => item.toolId),
                skillHostToolIds: [],
            });
        }
        const row = await this.prisma.skill.create({
            data: Object.assign({ appClientId,
                name,
                capabilityKey, description: this.normalizeOptionalText(dto.description), prompt,
                riskLevel, config: dto.config === undefined
                    ? undefined
                    : dto.config, isActive: (_a = dto.isActive) !== null && _a !== void 0 ? _a : true, workflowId: (_b = dto.workflowId) !== null && _b !== void 0 ? _b : undefined, workflowVersion: (_c = dto.workflowVersion) !== null && _c !== void 0 ? _c : undefined, workflowOverrides: dto.workflowOverrides === undefined
                    ? undefined
                    : dto.workflowOverrides === null
                        ? client_1.Prisma.JsonNull
                        : dto.workflowOverrides, skillTools: toolBindings.length > 0
                    ? {
                        create: toolBindings.map((item) => ({
                            toolId: item.toolId,
                            isRequired: item.isRequired,
                        })),
                    }
                    : undefined }, (linkAgentId != null
                ? {
                    agentSkills: {
                        create: [{ agentId: linkAgentId }],
                    },
                }
                : {})),
            include: skill_types_1.SKILL_DETAIL_INCLUDE,
        });
        await this.invalidateAppClientSkillCaches(appClientId);
        return (0, skill_mapper_1.toSkillResponse)(row);
    }
    async findPageByAgent(agentId, appClientId, query) {
        await this.assertAgentInAppClient(agentId, appClientId);
        const skillCtx = await (0, agent_capability_load_util_1.loadAgentSkillVisibilityContext)(this.prisma, appClientId, agentId);
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.pageSize);
        const where = Object.assign(Object.assign({}, (0, capability_candidate_util_1.buildAgentSkillVisibilityWhere)({
            appClientId,
            agentId,
            restrictSkills: skillCtx.restrictSkills,
            skillWhitelistIds: skillCtx.skillWhitelistIds,
        })), (0, skill_query_util_1.buildSkillFilterFields)(query));
        const orderBy = (0, skill_query_util_1.buildSkillOrderBy)(query.orderBy, query.order);
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.skill.findMany({
                where,
                orderBy,
                skip,
                take,
                include: skill_types_1.SKILL_LIST_INCLUDE,
            }),
            this.prisma.skill.count({ where }),
        ]);
        return (0, pagination_1.toPaginatedResult)((0, skill_mapper_1.toSkillListResponseList)(rows), total, page, pageSize);
    }
    async findClientListByAgentForUser(agentId, userId, appClientId, query = {}) {
        var _a, _b;
        await this.assertAgentInAppClient(agentId, appClientId);
        const allowedTools = await this.agentService.getAllowedTools(agentId, userId, appClientId);
        const allowedToolIds = new Set(allowedTools.map((tool) => tool.id));
        const rows = (await this.skillRuntime.listAgentSkillsForUser({
            agentId,
            userId,
            appClientId,
        })).filter((skill) => (0, skill_runnable_util_1.skillIsWorkflowBound)(skill) ||
            (0, skill_runnable_util_1.filterRunnableSkills)([skill], allowedToolIds).length > 0);
        const filtered = rows.filter((row) => this.matchesClientSkillQuery(row, query));
        const pageScope = (_b = (_a = query.page) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
        const pageHostToolIds = pageScope.length > 0
            ? await this.resolvePageScopedHostToolIds(appClientId, agentId, pageScope)
            : null;
        const pageFiltered = pageHostToolIds != null
            ? filtered.filter((row) => (0, skill_runnable_util_1.skillIsVisibleOnClientPage)(Object.assign(Object.assign({}, (0, skill_runnable_util_1.normalizeSkillRunnableCapabilities)(row)), { workflowId: row.workflowId }), pageHostToolIds))
            : filtered;
        return pageFiltered.map((row) => {
            const item = {
                id: row.id,
                name: row.name,
                description: row.description,
                capabilityKey: row.capabilityKey,
                riskLevel: row.riskLevel,
                requiresWriteConfirmation: (0, risk_level_util_1.skillRequiresWriteConfirmation)(row.riskLevel),
                toolIds: row.toolIds,
                hostToolIds: row.hostToolIds,
            };
            if (pageHostToolIds != null) {
                item.pageMatched = (0, skill_runnable_util_1.skillMatchesPageHostTools)((0, skill_runnable_util_1.normalizeSkillRunnableCapabilities)(row), pageHostToolIds);
            }
            return item;
        });
    }
    async resolvePageScopedHostToolIds(appClientId, agentId, pageScope) {
        const { tools } = await this.hostToolCatalogService.resolveLlmHostTools({
            appClientId,
            agentId,
            skillId: null,
            pageScope,
        });
        return new Set(tools.map((tool) => tool.id));
    }
    async findPageByAppClient(appClientId, query) {
        await this.assertAppClientExists(appClientId);
        if (query.agentId != null) {
            await this.assertAgentInAppClient(query.agentId, appClientId);
        }
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.pageSize);
        const where = (0, skill_query_util_1.buildSkillWhereForAppClient)(appClientId, query, query.agentId);
        const orderBy = (0, skill_query_util_1.buildSkillOrderBy)(query.orderBy, query.order);
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.skill.findMany({
                where,
                orderBy,
                skip,
                take,
                include: skill_types_1.SKILL_LIST_INCLUDE,
            }),
            this.prisma.skill.count({ where }),
        ]);
        return (0, pagination_1.toPaginatedResult)((0, skill_mapper_1.toSkillListResponseList)(rows), total, page, pageSize);
    }
    async findOne(skillId) {
        return (0, skill_mapper_1.toSkillResponse)(await this.getSkillOrThrow(skillId));
    }
    async update(skillId, dto) {
        var _a, _b;
        const existing = await this.getSkillOrThrow(skillId);
        if (dto.name !== undefined && !dto.name.trim()) {
            throw new common_1.BadRequestException('name cannot be empty');
        }
        if (dto.prompt !== undefined && !dto.prompt.trim()) {
            throw new common_1.BadRequestException('prompt cannot be empty');
        }
        const capabilityKey = dto.capabilityKey === undefined
            ? undefined
            : (0, skill_capability_key_util_1.normalizeCapabilityKey)(dto.capabilityKey);
        if (dto.workflowId != null) {
            await this.workflowService.assertWorkflowReferenceCompatible({
                workflowId: dto.workflowId,
                appClientId: existing.appClientId,
                entry: 'skill',
            });
        }
        const nextWorkflowId = dto.workflowId !== undefined ? dto.workflowId : existing.workflowId;
        const nextWorkflowVersion = dto.workflowVersion !== undefined
            ? dto.workflowVersion
            : existing.workflowVersion;
        if (nextWorkflowId != null && nextWorkflowId > 0) {
            await this.assertSkillWorkflowBindingsIfNeeded({
                workflowId: nextWorkflowId,
                workflowVersion: nextWorkflowVersion,
                appClientId: existing.appClientId,
                skillToolIds: existing.skillTools.map((row) => row.toolId),
                skillHostToolIds: existing.skillHostTools.map((row) => row.hostToolId),
            });
        }
        const row = await this.prisma.skill.update({
            where: { id: skillId },
            data: Object.assign(Object.assign(Object.assign({ name: (_a = dto.name) === null || _a === void 0 ? void 0 : _a.trim(), prompt: (_b = dto.prompt) === null || _b === void 0 ? void 0 : _b.trim(), capabilityKey, description: dto.description === undefined
                    ? undefined
                    : this.normalizeOptionalText(dto.description), config: dto.config === undefined
                    ? undefined
                    : dto.config === null
                        ? client_1.Prisma.JsonNull
                        : dto.config, isActive: dto.isActive, riskLevel: dto.riskLevel }, (dto.workflowId !== undefined
                ? { workflowId: dto.workflowId }
                : {})), (dto.workflowVersion !== undefined
                ? { workflowVersion: dto.workflowVersion }
                : {})), (dto.workflowOverrides !== undefined
                ? {
                    workflowOverrides: dto.workflowOverrides === null
                        ? client_1.Prisma.JsonNull
                        : dto.workflowOverrides,
                }
                : {})),
            include: skill_types_1.SKILL_DETAIL_INCLUDE,
        });
        await this.invalidateAppClientSkillCaches(existing.appClientId);
        return (0, skill_mapper_1.toSkillResponse)(row);
    }
    async replaceTools(skillId, dto) {
        const existing = await this.getSkillOrThrow(skillId);
        const toolBindings = this.normalizeToolBindings(dto.tools);
        await this.assertToolsInApp(existing.appClientId, toolBindings);
        if (existing.workflowId != null && existing.workflowId > 0) {
            await this.assertSkillWorkflowBindingsIfNeeded({
                workflowId: existing.workflowId,
                workflowVersion: existing.workflowVersion,
                appClientId: existing.appClientId,
                skillToolIds: toolBindings.map((item) => item.toolId),
                skillHostToolIds: existing.skillHostTools.map((row) => row.hostToolId),
            });
        }
        const riskLevel = (0, skill_risk_util_1.resolveSkillRiskLevel)({
            explicit: existing.riskLevel,
            toolRiskLevels: await this.fetchToolRiskLevels(toolBindings.map((item) => item.toolId)),
        });
        const row = await this.prisma.$transaction(async (tx) => {
            await tx.skillTool.deleteMany({ where: { skillId } });
            if (toolBindings.length > 0) {
                await tx.skillTool.createMany({
                    data: toolBindings.map((item) => ({
                        skillId,
                        toolId: item.toolId,
                        isRequired: item.isRequired,
                    })),
                });
            }
            return tx.skill.update({
                where: { id: skillId },
                data: { riskLevel },
                include: skill_types_1.SKILL_DETAIL_INCLUDE,
            });
        });
        await this.invalidateAppClientSkillCaches(existing.appClientId);
        return (0, skill_mapper_1.toSkillResponse)(row);
    }
    async remove(skillId) {
        const row = await this.getSkillOrThrow(skillId);
        await this.prisma.skill.delete({ where: { id: skillId } });
        await this.invalidateAppClientSkillCaches(row.appClientId);
        return (0, skill_mapper_1.toSkillResponse)(row);
    }
    async invalidateAppClientSkillCaches(appClientId) {
        await this.runtimeCacheInvalidator.invalidateForAppClient(appClientId);
    }
    async invalidateAgentRuntimeCache(agentId, appClientId) {
        await this.runtimeCacheInvalidator.invalidateForSkillAgent(agentId, appClientId);
    }
    matchesClientSkillQuery(row, query) {
        var _a, _b, _c, _d, _e, _f;
        if ((_a = query.name) === null || _a === void 0 ? void 0 : _a.trim()) {
            const needle = query.name.trim().toLowerCase();
            if (!row.name.toLowerCase().includes(needle)) {
                return false;
            }
        }
        if ((_b = query.capabilityKey) === null || _b === void 0 ? void 0 : _b.trim()) {
            const needle = query.capabilityKey.trim().toLowerCase();
            if (!((_c = row.capabilityKey) === null || _c === void 0 ? void 0 : _c.toLowerCase().includes(needle))) {
                return false;
            }
        }
        if ((_d = query.keyword) === null || _d === void 0 ? void 0 : _d.trim()) {
            const needle = query.keyword.trim().toLowerCase();
            const haystacks = [
                row.name,
                (_e = row.description) !== null && _e !== void 0 ? _e : '',
                (_f = row.capabilityKey) !== null && _f !== void 0 ? _f : '',
            ];
            if (!haystacks.some((text) => text.toLowerCase().includes(needle))) {
                return false;
            }
        }
        return true;
    }
    async getSkillOrThrow(skillId) {
        const row = await this.prisma.skill.findUnique({
            where: { id: skillId },
            include: skill_types_1.SKILL_DETAIL_INCLUDE,
        });
        if (!row) {
            throw new common_1.NotFoundException(`skill ${skillId} not found`);
        }
        return row;
    }
    normalizeToolBindings(tools) {
        var _a;
        if (!(tools === null || tools === void 0 ? void 0 : tools.length)) {
            return [];
        }
        const seen = new Set();
        const normalized = [];
        for (const item of tools) {
            if (seen.has(item.toolId)) {
                throw new common_1.BadRequestException(`duplicate toolId in skill tools: ${item.toolId}`);
            }
            seen.add(item.toolId);
            normalized.push({
                toolId: item.toolId,
                isRequired: (_a = item.isRequired) !== null && _a !== void 0 ? _a : false,
            });
        }
        return normalized;
    }
    async assertToolsInApp(appClientId, bindings) {
        if (bindings.length === 0) {
            return;
        }
        const toolIds = bindings.map((item) => item.toolId);
        const rows = await this.prisma.tool.findMany({
            where: {
                appClientId,
                id: { in: toolIds },
                isActive: true,
            },
            select: { id: true },
        });
        if (rows.length !== toolIds.length) {
            const found = new Set(rows.map((row) => row.id));
            const missing = toolIds.filter((id) => !found.has(id));
            throw new common_1.BadRequestException(`tool id(s) must belong to appClient ${appClientId} and be active: ${missing.join(', ')}`);
        }
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
    async assertAgentInAppClient(agentId, appClientId) {
        await this.assertAppClientExists(appClientId);
        const agent = await this.prisma.agent.findFirst({
            where: { id: agentId, appClientId },
            select: { id: true },
        });
        if (!agent) {
            throw new common_1.NotFoundException(`agent ${agentId} not found under appClient ${appClientId}`);
        }
    }
    async fetchToolRiskLevels(toolIds) {
        if (toolIds.length === 0) {
            return [];
        }
        const rows = await this.prisma.tool.findMany({
            where: { id: { in: toolIds } },
            select: { riskLevel: true },
        });
        return rows.map((row) => row.riskLevel);
    }
    normalizeOptionalText(value) {
        if (value == null) {
            return null;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    async assertSkillWorkflowBindingsIfNeeded(input) {
        await this.workflowService.assertSkillWorkflowBindingsCompatible(input);
    }
};
SkillService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        skill_service_1.SkillService,
        agent_service_1.AgentService,
        runtime_cache_invalidator_service_1.RuntimeCacheInvalidator,
        agent_host_tool_catalog_service_1.AgentHostToolCatalogService,
        workflow_service_1.WorkflowService])
], SkillService);
exports.SkillService = SkillService;
//# sourceMappingURL=skill.service.js.map