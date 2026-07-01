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
var HostToolService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostToolService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../generated/prisma/client");
const pagination_1 = require("../../common/pagination");
const host_bridge_1 = require("../../core/host-bridge");
const host_tool_resolve_debug_util_1 = require("../../core/host-bridge/host-tool-resolve-debug.util");
const host_tool_catalog_resolve_util_1 = require("../../core/runtime-cache/host-tool-catalog-resolve.util");
const agent_host_tool_catalog_service_1 = require("../../core/runtime-cache/agent-host-tool-catalog.service");
const agent_capability_load_util_1 = require("../../core/runtime-cache/agent-capability-load.util");
const runtime_cache_invalidator_service_1 = require("../../core/runtime-cache/runtime-cache-invalidator.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const workflow_service_1 = require("../workflow/workflow.service");
const host_tool_mapper_1 = require("./host-tool.mapper");
const host_tool_types_1 = require("./host-tool.types");
const LLM_SKILL_TRIGGERS = [
    client_1.HostToolSkillTrigger.LLM_SCOPED,
    client_1.HostToolSkillTrigger.ON_PLAN_STEP,
];
let HostToolService = HostToolService_1 = class HostToolService {
    constructor(prisma, hostToolCatalogService, runtimeCacheInvalidator, workflowService) {
        this.prisma = prisma;
        this.hostToolCatalogService = hostToolCatalogService;
        this.runtimeCacheInvalidator = runtimeCacheInvalidator;
        this.workflowService = workflowService;
        this.logger = new common_1.Logger(HostToolService_1.name);
    }
    async createHostPage(dto) {
        var _a, _b, _c, _d;
        await this.assertAppClientExists(dto.appClientId);
        const row = await this.prisma.hostPage.create({
            data: {
                appClientId: dto.appClientId,
                scope: dto.scope.trim(),
                label: dto.label.trim(),
                description: ((_a = dto.description) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                routePattern: ((_b = dto.routePattern) === null || _b === void 0 ? void 0 : _b.trim()) || null,
                sortOrder: (_c = dto.sortOrder) !== null && _c !== void 0 ? _c : 0,
                isActive: (_d = dto.isActive) !== null && _d !== void 0 ? _d : true,
            },
            include: host_tool_types_1.HOST_PAGE_DETAIL_INCLUDE,
        });
        return (0, host_tool_mapper_1.toHostPageResponse)(row);
    }
    async findHostPagePage(appClientId, query) {
        var _a, _b;
        await this.assertAppClientExists(appClientId);
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.pageSize);
        const where = Object.assign(Object.assign(Object.assign(Object.assign({ appClientId }, (query.id != null ? { id: query.id } : {})), (query.isActive != null ? { isActive: query.isActive } : {})), (((_a = query.scope) === null || _a === void 0 ? void 0 : _a.trim())
            ? { scope: { contains: query.scope.trim(), mode: 'insensitive' } }
            : {})), (((_b = query.keyword) === null || _b === void 0 ? void 0 : _b.trim())
            ? {
                OR: [
                    { scope: { contains: query.keyword.trim(), mode: 'insensitive' } },
                    { label: { contains: query.keyword.trim(), mode: 'insensitive' } },
                    {
                        description: {
                            contains: query.keyword.trim(),
                            mode: 'insensitive',
                        },
                    },
                ],
            }
            : {}));
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.hostPage.findMany({
                where,
                skip,
                take,
                orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
                include: host_tool_types_1.HOST_PAGE_DETAIL_INCLUDE,
            }),
            this.prisma.hostPage.count({ where }),
        ]);
        return (0, pagination_1.toPaginatedResult)(rows.map(host_tool_mapper_1.toHostPageResponse), total, page, pageSize);
    }
    async findHostPageOne(id) {
        const row = await this.prisma.hostPage.findUnique({
            where: { id },
            include: host_tool_types_1.HOST_PAGE_DETAIL_INCLUDE,
        });
        if (!row) {
            throw new common_1.NotFoundException(`host page ${id} not found`);
        }
        return (0, host_tool_mapper_1.toHostPageResponse)(row);
    }
    async updateHostPage(id, dto) {
        var _a, _b;
        await this.findHostPageOne(id);
        const row = await this.prisma.hostPage.update({
            where: { id },
            data: {
                scope: (_a = dto.scope) === null || _a === void 0 ? void 0 : _a.trim(),
                label: (_b = dto.label) === null || _b === void 0 ? void 0 : _b.trim(),
                description: dto.description,
                routePattern: dto.routePattern,
                sortOrder: dto.sortOrder,
                isActive: dto.isActive,
            },
            include: host_tool_types_1.HOST_PAGE_DETAIL_INCLUDE,
        });
        await this.invalidateHostToolsForHostPage(id);
        return (0, host_tool_mapper_1.toHostPageResponse)(row);
    }
    async removeHostPage(id) {
        const existing = await this.findHostPageOne(id);
        await this.invalidateHostToolsForHostPage(id);
        await this.prisma.hostPage.delete({ where: { id } });
        return existing;
    }
    async invalidateHostToolsForHostPage(hostPageId) {
        const hostTools = await this.prisma.hostTool.findMany({
            where: { hostPageId },
            select: { id: true },
        });
        if (hostTools.length > 0) {
            await this.runtimeCacheInvalidator.invalidateForHostTools(hostTools.map((row) => row.id));
        }
    }
    async createHostTool(dto) {
        var _a, _b, _c;
        await this.assertAppClientExists(dto.appClientId);
        if (dto.hostPageId != null) {
            await this.assertHostPageInApp(dto.hostPageId, dto.appClientId);
        }
        const row = await this.prisma.hostTool.create({
            data: {
                appClientId: dto.appClientId,
                hostPageId: (_a = dto.hostPageId) !== null && _a !== void 0 ? _a : null,
                definitionKey: dto.definitionKey.trim(),
                name: dto.name.trim(),
                description: dto.description,
                argsSchema: dto.argsSchema,
                argsTemplate: dto.argsTemplate == null
                    ? undefined
                    : dto.argsTemplate,
                sortOrder: (_b = dto.sortOrder) !== null && _b !== void 0 ? _b : 0,
                isActive: (_c = dto.isActive) !== null && _c !== void 0 ? _c : true,
                config: dto.config == null
                    ? undefined
                    : dto.config,
            },
            include: host_tool_types_1.HOST_TOOL_DETAIL_INCLUDE,
        });
        return (0, host_tool_mapper_1.toHostToolResponse)(row);
    }
    async findHostToolPage(appClientId, query) {
        var _a, _b;
        await this.assertAppClientExists(appClientId);
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.pageSize);
        const where = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ appClientId }, (query.id != null ? { id: query.id } : {})), (query.isActive != null ? { isActive: query.isActive } : {})), (query.genericOnly === true ? { hostPageId: null } : {})), (((_a = query.scope) === null || _a === void 0 ? void 0 : _a.trim())
            ? {
                hostPage: {
                    scope: { equals: query.scope.trim(), mode: 'insensitive' },
                },
            }
            : {})), (((_b = query.keyword) === null || _b === void 0 ? void 0 : _b.trim())
            ? {
                OR: [
                    { name: { contains: query.keyword.trim(), mode: 'insensitive' } },
                    {
                        definitionKey: {
                            contains: query.keyword.trim(),
                            mode: 'insensitive',
                        },
                    },
                    {
                        description: {
                            contains: query.keyword.trim(),
                            mode: 'insensitive',
                        },
                    },
                ],
            }
            : {}));
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.hostTool.findMany({
                where,
                skip,
                take,
                orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
                include: host_tool_types_1.HOST_TOOL_DETAIL_INCLUDE,
            }),
            this.prisma.hostTool.count({ where }),
        ]);
        return (0, pagination_1.toPaginatedResult)(rows.map(host_tool_mapper_1.toHostToolResponse), total, page, pageSize);
    }
    async findHostToolOne(id) {
        const row = await this.prisma.hostTool.findUnique({
            where: { id },
            include: host_tool_types_1.HOST_TOOL_DETAIL_INCLUDE,
        });
        if (!row) {
            throw new common_1.NotFoundException(`host tool ${id} not found`);
        }
        return (0, host_tool_mapper_1.toHostToolResponse)(row);
    }
    async updateHostTool(id, dto) {
        var _a, _b;
        const existing = await this.prisma.hostTool.findUnique({
            where: { id },
            select: { id: true, appClientId: true },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`host tool ${id} not found`);
        }
        if (dto.hostPageId != null) {
            await this.assertHostPageInApp(dto.hostPageId, existing.appClientId);
        }
        const row = await this.prisma.hostTool.update({
            where: { id },
            data: {
                hostPageId: dto.hostPageId,
                definitionKey: (_a = dto.definitionKey) === null || _a === void 0 ? void 0 : _a.trim(),
                name: (_b = dto.name) === null || _b === void 0 ? void 0 : _b.trim(),
                description: dto.description,
                argsSchema: dto.argsSchema,
                argsTemplate: dto.argsTemplate === undefined
                    ? undefined
                    : dto.argsTemplate === null
                        ? client_1.Prisma.JsonNull
                        : dto.argsTemplate,
                sortOrder: dto.sortOrder,
                isActive: dto.isActive,
                config: dto.config === undefined
                    ? undefined
                    : dto.config === null
                        ? client_1.Prisma.JsonNull
                        : dto.config,
            },
            include: host_tool_types_1.HOST_TOOL_DETAIL_INCLUDE,
        });
        await this.runtimeCacheInvalidator.invalidateForHostTools([id]);
        return (0, host_tool_mapper_1.toHostToolResponse)(row);
    }
    async removeHostTool(id) {
        const existing = await this.findHostToolOne(id);
        await this.prisma.hostTool.delete({ where: { id } });
        await this.runtimeCacheInvalidator.invalidateForHostTools([id]);
        return existing;
    }
    async getHostToolsForAgent(agentId, appClientId, query) {
        await this.assertAgentInAppClient(agentId, appClientId);
        const pageResult = await this.findHostToolPage(appClientId, query);
        const boundIds = new Set((await this.prisma.agentHostTool.findMany({
            where: { agentId },
            select: { hostToolId: true },
        })).map((row) => row.hostToolId));
        return Object.assign(Object.assign({ agentId,
            appClientId }, pageResult), { items: pageResult.items.map((item) => (Object.assign(Object.assign({}, item), { bound: boundIds.has(item.id) }))) });
    }
    async addHostToolsToAgent(agentId, appClientId, dto) {
        await this.assertAgentInAppClient(agentId, appClientId);
        await this.assertHostToolsBelongToApp(dto.hostToolIds, appClientId);
        await this.prisma.agentHostTool.createMany({
            data: dto.hostToolIds.map((hostToolId) => ({ agentId, hostToolId })),
            skipDuplicates: true,
        });
        await this.runtimeCacheInvalidator.invalidateForAgent({ agentId, appClientId });
        await this.runtimeCacheInvalidator.invalidateForHostTools(dto.hostToolIds);
        return this.listAgentHostToolBindings(agentId, appClientId);
    }
    async removeHostToolsFromAgent(agentId, appClientId, dto) {
        await this.assertAgentInAppClient(agentId, appClientId);
        await this.prisma.agentHostTool.deleteMany({
            where: {
                agentId,
                hostToolId: { in: dto.hostToolIds },
            },
        });
        await this.runtimeCacheInvalidator.invalidateForAgent({ agentId, appClientId });
        await this.runtimeCacheInvalidator.invalidateForHostTools(dto.hostToolIds);
        return this.listAgentHostToolBindings(agentId, appClientId);
    }
    async listAgentHostToolBindings(agentId, appClientId) {
        const bindings = await this.prisma.agentHostTool.findMany({
            where: { agentId },
            include: { hostTool: { include: host_tool_types_1.HOST_TOOL_DETAIL_INCLUDE } },
            orderBy: { id: 'asc' },
        });
        const response = (0, host_tool_mapper_1.toAgentHostToolsBindingResponse)(agentId, appClientId, bindings);
        return Object.assign(Object.assign({}, response), { items: response.hostTools });
    }
    async replaceSkillHostTools(skillId, dto) {
        const skill = await this.getSkillOrThrow(skillId);
        const hostToolIds = dto.tools.map((item) => item.hostToolId);
        await this.assertHostToolsInApp(skill.appClientId, hostToolIds);
        if (skill.workflowId != null && skill.workflowId > 0) {
            const skillTools = await this.prisma.skillTool.findMany({
                where: { skillId },
                select: { toolId: true },
            });
            await this.workflowService.assertSkillWorkflowBindingsCompatible({
                workflowId: skill.workflowId,
                appClientId: skill.appClientId,
                workflowVersion: skill.workflowVersion,
                skillToolIds: skillTools.map((row) => row.toolId),
                skillHostToolIds: hostToolIds,
            });
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.skillHostTool.deleteMany({ where: { skillId } });
            if (dto.tools.length > 0) {
                await tx.skillHostTool.createMany({
                    data: dto.tools.map((item) => {
                        var _a, _b, _c;
                        return ({
                            skillId,
                            hostToolId: item.hostToolId,
                            trigger: (_a = item.trigger) !== null && _a !== void 0 ? _a : client_1.HostToolSkillTrigger.ON_MUTATION_SUCCESS,
                            argsTemplate: item.argsTemplate == null
                                ? undefined
                                : item.argsTemplate,
                            priority: (_b = item.priority) !== null && _b !== void 0 ? _b : 0,
                            isRequired: (_c = item.isRequired) !== null && _c !== void 0 ? _c : false,
                        });
                    }),
                });
            }
        });
        await this.runtimeCacheInvalidator.invalidateForAppClient(skill.appClientId);
        if (hostToolIds.length > 0) {
            await this.runtimeCacheInvalidator.invalidateForHostTools(hostToolIds);
        }
        return this.listSkillHostToolBindings(skillId);
    }
    async listSkillHostToolBindings(skillId) {
        const skill = await this.getSkillOrThrow(skillId);
        const bindings = await this.prisma.skillHostTool.findMany({
            where: { skillId },
            include: { hostTool: { include: host_tool_types_1.HOST_TOOL_DETAIL_INCLUDE } },
            orderBy: [{ priority: 'asc' }, { id: 'asc' }],
        });
        const response = (0, host_tool_mapper_1.toSkillHostToolsBindingResponse)(skillId, skill.appClientId, bindings);
        return Object.assign(Object.assign({}, response), { items: response.skillHostTools.map((row) => (Object.assign(Object.assign({}, row.hostTool), { trigger: row.trigger, priority: row.priority, isRequired: row.isRequired, skillArgsTemplate: row.skillArgsTemplate }))) });
    }
    async registerClientHostTools(appClientId, dto) {
        var _a, _b, _c;
        await this.assertAppClientExists(appClientId);
        const batchScope = ((_a = dto.scope) === null || _a === void 0 ? void 0 : _a.trim()) || undefined;
        const created = [];
        const skipped = [];
        for (const item of dto.tools) {
            const name = item.name.trim();
            const itemScope = ((_b = item.scope) === null || _b === void 0 ? void 0 : _b.trim()) || batchScope;
            const isGeneric = item.generic === true || !itemScope;
            const existing = await this.prisma.hostTool.findUnique({
                where: {
                    appClientId_name: { appClientId, name },
                },
                select: { id: true, name: true },
            });
            if (existing) {
                skipped.push({
                    name: existing.name,
                    id: existing.id,
                    reason: 'already_exists',
                });
                continue;
            }
            let hostPageId = null;
            if (!isGeneric && itemScope) {
                hostPageId = await this.ensureHostPageForScope(appClientId, itemScope, dto.pageLabel, dto.routePattern);
            }
            const definitionKey = ((_c = item.definitionKey) === null || _c === void 0 ? void 0 : _c.trim()) ||
                (isGeneric ? name : `${itemScope}.${name}`);
            const row = await this.prisma.hostTool.create({
                data: {
                    appClientId,
                    hostPageId,
                    definitionKey,
                    name,
                    description: item.description,
                    argsSchema: item.argsSchema,
                    argsTemplate: item.argsTemplate == null
                        ? undefined
                        : item.argsTemplate,
                    isActive: true,
                },
                include: host_tool_types_1.HOST_TOOL_DETAIL_INCLUDE,
            });
            created.push({
                name: row.name,
                id: row.id,
                created: true,
                tool: (0, host_tool_mapper_1.toHostToolResponse)(row),
            });
        }
        return { created, skipped };
    }
    async findClientCatalog(appClientId, query) {
        var _a;
        const scope = ((_a = query.scope) === null || _a === void 0 ? void 0 : _a.trim()) || undefined;
        const where = Object.assign(Object.assign({ appClientId, isActive: true }, (scope
            ? {
                OR: [{ hostPageId: null }, { hostPage: { scope } }],
            }
            : {})), (query.agentId != null
            ? {
                agentHostTools: { some: { agentId: query.agentId } },
            }
            : {}));
        const rows = await this.prisma.hostTool.findMany({
            where,
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
            include: host_tool_types_1.HOST_TOOL_DETAIL_INCLUDE,
        });
        return rows.map(host_tool_mapper_1.toClientHostToolCatalogItem);
    }
    async resolvePreferredHostToolIds(input) {
        var _a, _b, _c, _d, _e, _f;
        const agent = await this.prisma.agent.findUnique({
            where: { id: input.agentId },
            select: { appClientId: true },
        });
        if (!agent) {
            return { preferredIds: [], skillBindings: [] };
        }
        const agentBoundIds = await (0, agent_capability_load_util_1.loadAgentHostToolCandidateIds)(this.prisma, agent.appClientId, input.agentId);
        if (agentBoundIds.length === 0) {
            (0, host_tool_resolve_debug_util_1.logHostToolResolve)('resolvePreferredHostToolIds', {
                runId: (_a = input.runId) !== null && _a !== void 0 ? _a : null,
                sessionId: (_b = input.sessionId) !== null && _b !== void 0 ? _b : null,
                agentId: input.agentId,
                skillId: (_c = input.skillId) !== null && _c !== void 0 ? _c : null,
                skillTriggers: input.skillTriggers,
                agentBoundIds,
                preferredIds: [],
                selectionBranch: 'empty_no_agent_bindings',
            });
            return { preferredIds: [], skillBindings: [] };
        }
        const allSkillBindings = input.skillId != null
            ? await this.prisma.skillHostTool.findMany({
                where: {
                    skillId: input.skillId,
                    hostToolId: { in: agentBoundIds },
                },
                orderBy: [{ priority: 'asc' }, { id: 'asc' }],
                select: {
                    hostToolId: true,
                    argsTemplate: true,
                    trigger: true,
                    isRequired: true,
                },
            })
            : [];
        const skillBindings = allSkillBindings
            .filter((row) => input.skillTriggers.includes(row.trigger))
            .map((row) => ({
            hostToolId: row.hostToolId,
            argsTemplate: row.argsTemplate,
            isRequired: row.isRequired,
        }));
        let preferredIds;
        let selectionBranch;
        if (input.skillId != null) {
            if (skillBindings.length > 0) {
                preferredIds = skillBindings.map((row) => row.hostToolId);
                selectionBranch = 'skill_bindings';
            }
            else if (allSkillBindings.length === 0) {
                this.logger.warn(`skill ${input.skillId} has no SkillHostTool bindings; falling back to AgentHostTool whitelist for triggers [${input.skillTriggers.join(', ')}]`);
                preferredIds = agentBoundIds;
                selectionBranch = 'agent_fallback_no_skill_bindings';
            }
            else {
                preferredIds = [];
                selectionBranch = 'empty_skill_trigger_mismatch';
            }
        }
        else {
            preferredIds = agentBoundIds;
            selectionBranch = 'agent_whitelist_no_skill';
        }
        (0, host_tool_resolve_debug_util_1.logHostToolResolve)('resolvePreferredHostToolIds', {
            runId: (_d = input.runId) !== null && _d !== void 0 ? _d : null,
            sessionId: (_e = input.sessionId) !== null && _e !== void 0 ? _e : null,
            agentId: input.agentId,
            skillId: (_f = input.skillId) !== null && _f !== void 0 ? _f : null,
            skillTriggers: input.skillTriggers,
            agentBoundIds,
            allSkillBindings: allSkillBindings.map((row) => ({
                hostToolId: row.hostToolId,
                trigger: row.trigger,
                isRequired: row.isRequired,
            })),
            skillBindingsAfterTriggerFilter: skillBindings.map((row) => row.hostToolId),
            preferredIds,
            selectionBranch,
        });
        return { preferredIds, skillBindings };
    }
    async findScopedHostToolRows(input) {
        var _a, _b, _c, _d;
        if (input.preferredIds.length === 0) {
            return [];
        }
        const tools = await this.prisma.hostTool.findMany({
            where: {
                id: { in: input.preferredIds },
                appClientId: input.appClientId,
                isActive: true,
                OR: input.pageScope.trim()
                    ? [{ hostPageId: null }, { hostPage: { scope: input.pageScope } }]
                    : [{ hostPageId: null }],
            },
            include: host_tool_types_1.HOST_TOOL_DETAIL_INCLUDE,
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        });
        const toolById = new Map(tools.map((tool) => [tool.id, tool]));
        const matched = input.preferredIds
            .map((id) => toolById.get(id))
            .filter((tool) => tool != null);
        (0, host_tool_resolve_debug_util_1.logHostToolResolve)('findScopedHostToolRows', Object.assign({ runId: (_a = input.runId) !== null && _a !== void 0 ? _a : null, sessionId: (_b = input.sessionId) !== null && _b !== void 0 ? _b : null, agentId: (_c = input.agentId) !== null && _c !== void 0 ? _c : null, skillId: (_d = input.skillId) !== null && _d !== void 0 ? _d : null, appClientId: input.appClientId, pageScope: input.pageScope, preferredIds: input.preferredIds, matchedIds: matched.map((tool) => tool.id), matchedNames: matched.map((tool) => tool.name), droppedPreferredIds: input.preferredIds.filter((id) => !toolById.has(id)) }, ((0, host_tool_resolve_debug_util_1.isHostToolResolveDebugEnabled)()
            ? {
                pageFilterDiagnostics: await this.diagnoseHostToolPageFilter(input),
            }
            : {})));
        return matched;
    }
    async diagnoseHostToolPageFilter(input) {
        if (input.preferredIds.length === 0) {
            return [];
        }
        const rows = await this.prisma.hostTool.findMany({
            where: {
                id: { in: input.preferredIds },
                appClientId: input.appClientId,
            },
            include: { hostPage: { select: { scope: true } } },
        });
        const rowById = new Map(rows.map((row) => [row.id, row]));
        return input.preferredIds.map((id) => {
            var _a, _b;
            const row = rowById.get(id);
            if (!row) {
                return {
                    hostToolId: id,
                    status: 'not_found_or_wrong_app_client',
                };
            }
            const reasons = [];
            if (!row.isActive) {
                reasons.push('inactive');
            }
            const hostPageScope = (_b = (_a = row.hostPage) === null || _a === void 0 ? void 0 : _a.scope) !== null && _b !== void 0 ? _b : null;
            if (row.hostPageId != null && hostPageScope !== input.pageScope) {
                reasons.push(`page_mismatch:expected=${input.pageScope},actual=${hostPageScope}`);
            }
            return {
                hostToolId: id,
                name: row.name,
                status: reasons.length === 0 ? 'included' : 'filtered',
                hostPageScope,
                isActive: row.isActive,
                reasons,
            };
        });
    }
    toHostToolDecisionDefinition(tool, isRequired = false) {
        var _a, _b;
        return {
            id: tool.id,
            name: tool.name,
            description: tool.description,
            argsSchema: tool.argsSchema &&
                typeof tool.argsSchema === 'object' &&
                !Array.isArray(tool.argsSchema)
                ? tool.argsSchema
                : { type: 'object' },
            hostPageScope: (_b = (_a = tool.hostPage) === null || _a === void 0 ? void 0 : _a.scope) !== null && _b !== void 0 ? _b : null,
            isRequired,
        };
    }
    async resolveLlmHostToolsForDecision(input) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        const pageScope = (_a = (0, host_bridge_1.resolveHostToolPageScope)(input.pageContext)) !== null && _a !== void 0 ? _a : '';
        const catalog = await this.hostToolCatalogService.loadOrWarm(input.appClientId, input.agentId);
        if (catalog) {
            const { preferredIds } = (0, host_tool_catalog_resolve_util_1.resolvePreferredHostToolIdsFromCatalog)(catalog, {
                skillId: input.skillId,
                skillTriggers: LLM_SKILL_TRIGGERS,
            });
            const tools = (0, host_tool_catalog_resolve_util_1.resolveLlmHostToolsFromCatalog)(catalog, {
                pageScope,
                skillId: input.skillId,
                skillTriggers: LLM_SKILL_TRIGGERS,
            });
            (0, host_tool_resolve_debug_util_1.logHostToolResolve)('resolveLlmHostToolsForDecision', {
                runId: (_b = input.runId) !== null && _b !== void 0 ? _b : null,
                sessionId: (_c = input.sessionId) !== null && _c !== void 0 ? _c : null,
                appClientId: input.appClientId,
                agentId: input.agentId,
                skillId: (_d = input.skillId) !== null && _d !== void 0 ? _d : null,
                pageScope,
                routePath: (_f = (_e = input.pageContext) === null || _e === void 0 ? void 0 : _e.routePath) !== null && _f !== void 0 ? _f : null,
                source: 'catalog',
                catalogRevision: catalog.revision,
                agentBoundHostToolIds: catalog.agentBoundHostToolIds,
                preferredIds,
                toolCount: tools.length,
                toolNames: tools.map((tool) => tool.name),
                pageFilterDiagnostics: (0, host_tool_catalog_resolve_util_1.buildHostToolCatalogFilterDiagnostics)(catalog, {
                    pageScope,
                    preferredIds,
                }),
            });
            return tools;
        }
        const tools = await this.resolveLlmHostToolsForDecisionFromDb(input);
        (0, host_tool_resolve_debug_util_1.logHostToolResolve)('resolveLlmHostToolsForDecision', {
            runId: (_g = input.runId) !== null && _g !== void 0 ? _g : null,
            sessionId: (_h = input.sessionId) !== null && _h !== void 0 ? _h : null,
            appClientId: input.appClientId,
            agentId: input.agentId,
            skillId: (_j = input.skillId) !== null && _j !== void 0 ? _j : null,
            pageScope,
            routePath: (_l = (_k = input.pageContext) === null || _k === void 0 ? void 0 : _k.routePath) !== null && _l !== void 0 ? _l : null,
            source: 'db',
            toolCount: tools.length,
            toolNames: tools.map((tool) => tool.name),
        });
        return tools;
    }
    async resolveLlmHostToolsForDecisionFromDb(input) {
        var _a;
        const pageScope = (_a = (0, host_bridge_1.resolveHostToolPageScope)(input.pageContext)) !== null && _a !== void 0 ? _a : '';
        const { preferredIds, skillBindings } = await this.resolvePreferredHostToolIds({
            agentId: input.agentId,
            skillId: input.skillId,
            skillTriggers: LLM_SKILL_TRIGGERS,
            runId: input.runId,
            sessionId: input.sessionId,
        });
        if (preferredIds.length === 0) {
            return [];
        }
        const requiredByToolId = new Map(skillBindings.map((row) => [row.hostToolId, row.isRequired]));
        const tools = await this.findScopedHostToolRows({
            appClientId: input.appClientId,
            pageScope,
            preferredIds,
            runId: input.runId,
            sessionId: input.sessionId,
            agentId: input.agentId,
            skillId: input.skillId,
        });
        return tools.map((tool) => {
            var _a;
            return this.toHostToolDecisionDefinition(tool, (_a = requiredByToolId.get(tool.id)) !== null && _a !== void 0 ? _a : false);
        });
    }
    async resolveCompletionHostTools(input) {
        var _a;
        const pageScope = (_a = (0, host_bridge_1.resolveHostToolPageScope)(input.pageContext)) !== null && _a !== void 0 ? _a : '';
        const { preferredIds, skillBindings } = await this.resolvePreferredHostToolIds({
            agentId: input.agentId,
            skillId: input.skillId,
            skillTriggers: [client_1.HostToolSkillTrigger.ON_MUTATION_SUCCESS],
        });
        if (preferredIds.length === 0) {
            return [];
        }
        const orderedTools = await this.findScopedHostToolRows({
            appClientId: input.appClientId,
            pageScope,
            preferredIds,
        });
        const skillTemplateByToolId = new Map(skillBindings.map((row) => [row.hostToolId, row.argsTemplate]));
        return orderedTools.map((tool) => {
            var _a;
            return ({
                name: tool.name,
                args: (0, host_bridge_1.resolveHostToolArgsTemplate)((_a = skillTemplateByToolId.get(tool.id)) !== null && _a !== void 0 ? _a : tool.argsTemplate, input.pageContext),
            });
        });
    }
    async ensureHostPageForScope(appClientId, scope, pageLabel, routePattern) {
        const existing = await this.prisma.hostPage.findUnique({
            where: { appClientId_scope: { appClientId, scope } },
            select: { id: true },
        });
        if (existing) {
            return existing.id;
        }
        const created = await this.prisma.hostPage.create({
            data: {
                appClientId,
                scope,
                label: (pageLabel === null || pageLabel === void 0 ? void 0 : pageLabel.trim()) || scope,
                routePattern: (routePattern === null || routePattern === void 0 ? void 0 : routePattern.trim()) || null,
            },
        });
        return created.id;
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
    async assertHostPageInApp(hostPageId, appClientId) {
        const row = await this.prisma.hostPage.findFirst({
            where: { id: hostPageId, appClientId },
            select: { id: true },
        });
        if (!row) {
            throw new common_1.BadRequestException(`host page ${hostPageId} not found in appClient ${appClientId}`);
        }
    }
    async assertAgentInAppClient(agentId, appClientId) {
        const row = await this.prisma.agent.findFirst({
            where: { id: agentId, appClientId },
            select: { id: true },
        });
        if (!row) {
            throw new common_1.NotFoundException(`agent ${agentId} not found in appClient ${appClientId}`);
        }
    }
    async assertHostToolsBelongToApp(hostToolIds, appClientId) {
        if (hostToolIds.length === 0) {
            return;
        }
        const count = await this.prisma.hostTool.count({
            where: { id: { in: hostToolIds }, appClientId },
        });
        if (count !== hostToolIds.length) {
            throw new common_1.BadRequestException('one or more host tools do not belong to this appClient');
        }
    }
    async assertHostToolsInApp(appClientId, hostToolIds) {
        if (hostToolIds.length === 0) {
            return;
        }
        const count = await this.prisma.hostTool.count({
            where: {
                appClientId,
                id: { in: hostToolIds },
                isActive: true,
            },
        });
        if (count !== hostToolIds.length) {
            throw new common_1.BadRequestException('skill host tools must belong to this appClient and be active');
        }
    }
    async getSkillOrThrow(skillId) {
        const row = await this.prisma.skill.findUnique({
            where: { id: skillId },
            select: {
                id: true,
                appClientId: true,
                workflowId: true,
                workflowVersion: true,
            },
        });
        if (!row) {
            throw new common_1.NotFoundException(`skill ${skillId} not found`);
        }
        return row;
    }
};
HostToolService = HostToolService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        agent_host_tool_catalog_service_1.AgentHostToolCatalogService,
        runtime_cache_invalidator_service_1.RuntimeCacheInvalidator,
        workflow_service_1.WorkflowService])
], HostToolService);
exports.HostToolService = HostToolService;
//# sourceMappingURL=host-tool.service.js.map