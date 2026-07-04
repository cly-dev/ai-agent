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
var AgentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentService = void 0;
const common_1 = require("@nestjs/common");
const pagination_1 = require("../../common/pagination");
const runtime_cache_invalidator_service_1 = require("../../core/runtime-cache/runtime-cache-invalidator.service");
const agent_tool_catalog_service_1 = require("../../core/runtime-cache/agent-tool-catalog.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const agent_mapper_1 = require("./mapper/agent.mapper");
const agent_types_1 = require("./types/agent.types");
const agent_tool_query_util_1 = require("./util/agent-tool-query.util");
const session_prepare_store_1 = require("../chat/session-prepare.store");
const agent_cache_store_1 = require("./cache/agent-cache.store");
const agent_capability_load_util_1 = require("../../core/runtime-cache/agent-capability-load.util");
const agent_client_access_util_1 = require("./util/agent-client-access.util");
let AgentService = AgentService_1 = class AgentService {
    constructor(prisma, agentCacheStore, sessionPrepareStore, runtimeCacheInvalidator, agentToolCatalogService) {
        this.prisma = prisma;
        this.agentCacheStore = agentCacheStore;
        this.sessionPrepareStore = sessionPrepareStore;
        this.runtimeCacheInvalidator = runtimeCacheInvalidator;
        this.agentToolCatalogService = agentToolCatalogService;
        this.logger = new common_1.Logger(AgentService_1.name);
    }
    async getRuntimeAgent(appClientId, agentId) {
        const cached = await this.agentCacheStore.get(appClientId, agentId);
        if (cached) {
            return cached;
        }
        const row = await this.prisma.agent.findFirst({
            where: { id: agentId, appClientId },
            select: {
                id: true,
                appClientId: true,
                name: true,
                systemPrompt: true,
                maxSteps: true,
                enableToolCall: true,
                config: true,
            },
        });
        if (!row) {
            return null;
        }
        const snapshot = {
            id: row.id,
            appClientId: row.appClientId,
            name: row.name,
            systemPrompt: row.systemPrompt,
            maxSteps: row.maxSteps,
            enableToolCall: row.enableToolCall,
            config: row.config,
        };
        await this.agentCacheStore.trySet(appClientId, agentId, snapshot);
        return snapshot;
    }
    async invalidateRuntimeCache(appClientId, agentId) {
        await this.agentCacheStore.delete(appClientId, agentId);
    }
    async create(dto) {
        var _a, _b, _c, _d, _e, _f;
        const hasToolBindings = Boolean(dto.toolIds && dto.toolIds.length > 0);
        const agent = await this.prisma.agent.create({
            data: {
                appClientId: dto.appClientId,
                name: dto.name,
                description: (_a = dto.description) !== null && _a !== void 0 ? _a : null,
                systemPrompt: dto.systemPrompt,
                maxSteps: (_b = dto.maxSteps) !== null && _b !== void 0 ? _b : 8,
                enableToolCall: (_c = dto.enableToolCall) !== null && _c !== void 0 ? _c : true,
                restrictTools: (_d = dto.restrictTools) !== null && _d !== void 0 ? _d : hasToolBindings,
                restrictHostTools: (_e = dto.restrictHostTools) !== null && _e !== void 0 ? _e : false,
                restrictSkills: (_f = dto.restrictSkills) !== null && _f !== void 0 ? _f : false,
                config: dto.config,
            },
        });
        if (dto.toolIds && dto.toolIds.length > 0) {
            await this.prisma.agentTool.createMany({
                data: dto.toolIds.map((toolId) => ({
                    agentId: agent.id,
                    toolId,
                })),
                skipDuplicates: true,
            });
        }
        return this.findOneWithTools(agent.id);
    }
    async findAll() {
        const rows = await this.prisma.agent.findMany({
            orderBy: { id: 'asc' },
            include: agent_types_1.AGENT_LIST_INCLUDE,
        });
        return (0, agent_mapper_1.toAgentListResponseList)(rows);
    }
    async findByAppClientId(appClientId) {
        await this.assertAppClientExists(appClientId);
        return this.prisma.agent.findMany({
            where: { appClientId },
            orderBy: { id: 'asc' },
        });
    }
    async findClientListByAppClientId(appClientId) {
        await this.assertAppClientExists(appClientId);
        return this.prisma.agent.findMany({
            where: { appClientId },
            orderBy: { id: 'asc' },
            select: {
                id: true,
                name: true,
                description: true,
            },
        });
    }
    async findClientAvailableAgentsForUser(userId, appClientId) {
        await this.assertAppClientExists(appClientId);
        const roleCtx = await this.resolveUserRoleToolContext(userId, appClientId);
        if (!roleCtx || roleCtx.roleToolIds.length === 0) {
            return [];
        }
        const accessibleTools = await this.prisma.tool.findMany({
            where: (0, agent_client_access_util_1.buildRoleAccessibleToolWhere)(appClientId, roleCtx, {}),
            select: { id: true },
        });
        const accessibleToolIds = accessibleTools.map((tool) => tool.id);
        if (accessibleToolIds.length === 0) {
            return [];
        }
        const accessibleToolIdSet = new Set(accessibleToolIds);
        const agents = await this.prisma.agent.findMany({
            where: { appClientId },
            orderBy: { id: 'asc' },
            select: { id: true, name: true, description: true },
        });
        const available = [];
        for (const agent of agents) {
            const candidateIds = await (0, agent_capability_load_util_1.loadAgentToolCandidateIds)(this.prisma, appClientId, agent.id);
            const hasOverlap = candidateIds.some((toolId) => accessibleToolIdSet.has(toolId));
            if (hasOverlap) {
                available.push(agent);
            }
        }
        return available;
    }
    async findOne(id) {
        return this.findOneWithTools(id);
    }
    async update(id, dto) {
        const existing = await this.findOneWithTools(id);
        await this.prisma.agent.update({
            where: { id },
            data: {
                appClientId: dto.appClientId,
                name: dto.name,
                description: dto.description,
                systemPrompt: dto.systemPrompt,
                maxSteps: dto.maxSteps,
                enableToolCall: dto.enableToolCall,
                restrictTools: dto.restrictTools,
                restrictHostTools: dto.restrictHostTools,
                restrictSkills: dto.restrictSkills,
                config: dto.config,
            },
        });
        if (dto.toolIds) {
            await this.prisma.$transaction([
                this.prisma.agentTool.deleteMany({ where: { agentId: id } }),
                this.prisma.agentTool.createMany({
                    data: dto.toolIds.map((toolId) => ({
                        agentId: id,
                        toolId,
                    })),
                    skipDuplicates: true,
                }),
            ]);
            if (dto.restrictTools === undefined) {
                await this.prisma.agent.update({
                    where: { id },
                    data: { restrictTools: dto.toolIds.length > 0 },
                });
            }
        }
        await this.invalidateRuntimeCache(existing.appClientId, id);
        await this.runtimeCacheInvalidator.invalidateForAgent({
            agentId: id,
            appClientId: existing.appClientId,
        });
        if (dto.appClientId != null &&
            dto.appClientId !== existing.appClientId) {
            await this.invalidateRuntimeCache(dto.appClientId, id);
        }
        return this.findOneWithTools(id);
    }
    async remove(id) {
        const row = await this.findOneWithTools(id);
        await this.runtimeCacheInvalidator.invalidateForAgent({
            agentId: id,
            appClientId: row.appClientId,
        });
        await this.prisma.agent.delete({ where: { id } });
        await this.invalidateRuntimeCache(row.appClientId, id);
        return row;
    }
    async findOneWithTools(id) {
        const row = await this.prisma.agent.findUnique({
            where: { id },
            include: agent_types_1.AGENT_WITH_TOOLS_INCLUDE,
        });
        if (!row) {
            throw new common_1.NotFoundException(`agent ${id} not found`);
        }
        return (0, agent_mapper_1.toAgentWithToolsResponse)(row);
    }
    async getToolsForAgent(agentId, appClientId, query) {
        await this.assertAgentInAppClient(agentId, appClientId);
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.pageSize);
        const { orderBy, order } = query.resolveOrder();
        const where = (0, agent_tool_query_util_1.buildAgentToolBindingsWhere)(agentId, appClientId, query);
        const orderByClause = (0, agent_tool_query_util_1.buildAgentToolBindingsOrderBy)(orderBy, order);
        const [bindings, total] = await this.prisma.$transaction([
            this.prisma.agentTool.findMany({
                where,
                orderBy: orderByClause,
                skip,
                take,
                include: {
                    tool: { select: agent_types_1.AGENT_LINKED_TOOL_SELECT },
                },
            }),
            this.prisma.agentTool.count({ where }),
        ]);
        const items = (0, agent_mapper_1.toAgentToolBindingItemList)(bindings);
        return Object.assign({ agentId,
            appClientId }, (0, pagination_1.toPaginatedResult)(items, total, page, pageSize));
    }
    async addToolsToAgent(agentId, appClientId, dto) {
        await this.assertAgentInAppClient(agentId, appClientId);
        const uniqueToolIds = [...new Set(dto.toolIds)];
        await this.assertToolsBelongToAppClient(uniqueToolIds, appClientId);
        await this.prisma.agentTool.createMany({
            data: uniqueToolIds.map((toolId) => ({
                agentId,
                toolId,
            })),
            skipDuplicates: true,
        });
        await this.runtimeCacheInvalidator.invalidateForAgent({
            agentId,
            appClientId,
        });
        const bindings = await this.findAgentToolBindings(agentId, appClientId);
        return (0, agent_mapper_1.toAgentToolsBindingResponse)(agentId, appClientId, bindings);
    }
    async removeToolsFromAgent(agentId, appClientId, dto) {
        await this.assertAgentInAppClient(agentId, appClientId);
        const uniqueToolIds = [...new Set(dto.toolIds)];
        await this.assertToolsBelongToAppClient(uniqueToolIds, appClientId);
        await this.prisma.agentTool.deleteMany({
            where: {
                agentId,
                toolId: { in: uniqueToolIds },
                tool: { appClientId },
            },
        });
        await this.runtimeCacheInvalidator.invalidateForAgent({
            agentId,
            appClientId,
        });
        const bindings = await this.findAgentToolBindings(agentId, appClientId);
        return (0, agent_mapper_1.toAgentToolsBindingResponse)(agentId, appClientId, bindings);
    }
    async getAllowedTools(agentId, userId, appClientId) {
        this.logger.debug(`getAllowedTools start agentId=${agentId} userId=${userId} appClientId=${appClientId}`);
        const filtered = await this.agentToolCatalogService.resolveAllowedTools(agentId, userId, appClientId);
        this.logger.debug(`getAllowedTools list ${JSON.stringify(filtered.map((tool) => ({
            id: tool.id,
            name: tool.name,
            definitionKey: tool.definitionKey,
            method: tool.method,
            path: tool.path,
        })))}`);
        this.logger.debug(`getAllowedTools result allowed=${filtered.length} appClientId=${appClientId}`);
        return filtered;
    }
    async resolveUserRoleToolContext(userId, appClientId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!user) {
            throw new common_1.NotFoundException(`user ${userId} not found`);
        }
        const userApp = await this.prisma.userApp.findFirst({
            where: { userId: user.id, appId: appClientId },
            select: {
                roleId: true,
                role: {
                    select: {
                        allowToolLevel: true,
                        roleTools: {
                            select: { toolId: true },
                        },
                    },
                },
            },
        });
        if (!userApp) {
            return null;
        }
        return {
            roleId: userApp.roleId,
            maxLevel: (0, agent_client_access_util_1.resolveMaxToolLevel)([userApp.role.allowToolLevel]),
            roleToolIds: userApp.role.roleTools.map((row) => row.toolId),
        };
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
    async assertToolsBelongToAppClient(toolIds, appClientId) {
        const rows = await this.prisma.tool.findMany({
            where: { id: { in: toolIds }, appClientId },
            select: { id: true },
        });
        if (rows.length !== toolIds.length) {
            const found = new Set(rows.map((r) => r.id));
            const missing = toolIds.filter((id) => !found.has(id));
            throw new common_1.BadRequestException(`tool id(s) not found for appClient ${appClientId}: ${missing.join(', ')}`);
        }
    }
    findAgentToolBindings(agentId, appClientId) {
        return this.prisma.agentTool.findMany({
            where: (0, agent_tool_query_util_1.buildAgentToolBindingsWhere)(agentId, appClientId, {}),
            orderBy: { toolId: 'asc' },
            include: {
                tool: { select: agent_types_1.AGENT_LINKED_TOOL_SELECT },
            },
        });
    }
};
AgentService = AgentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        agent_cache_store_1.AgentCacheStore,
        session_prepare_store_1.SessionPrepareStore,
        runtime_cache_invalidator_service_1.RuntimeCacheInvalidator,
        agent_tool_catalog_service_1.AgentToolCatalogService])
], AgentService);
exports.AgentService = AgentService;
//# sourceMappingURL=agent.service.js.map