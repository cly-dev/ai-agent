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
var AgentToolCatalogService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentToolCatalogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const agent_client_access_util_1 = require("../../modules/agent/util/agent-client-access.util");
const agent_tool_catalog_store_1 = require("./agent-tool-catalog.store");
const agent_tool_catalog_types_1 = require("./agent-tool-catalog.types");
const capability_candidate_util_1 = require("./capability-candidate.util");
const agent_tool_catalog_util_1 = require("./agent-tool-catalog.util");
const runtime_cache_observability_util_1 = require("./runtime-cache-observability.util");
const runtime_revision_util_1 = require("./runtime-revision.util");
let AgentToolCatalogService = AgentToolCatalogService_1 = class AgentToolCatalogService {
    constructor(prisma, catalogStore) {
        this.prisma = prisma;
        this.catalogStore = catalogStore;
        this.logger = new common_1.Logger(AgentToolCatalogService_1.name);
    }
    async resolveAllowedTools(agentId, userId, appClientId) {
        const agent = await this.prisma.agent.findFirst({
            where: { id: agentId, appClientId },
            select: { id: true },
        });
        if (!agent) {
            throw new common_1.NotFoundException(`agent ${agentId} not found`);
        }
        const roleCtx = await this.resolveUserRoleToolContext(userId, appClientId);
        if (!roleCtx) {
            return [];
        }
        const catalog = await this.loadOrWarm(appClientId, agentId);
        if (!catalog) {
            return [];
        }
        return (0, agent_tool_catalog_util_1.resolveAllowedToolsFromCatalog)(catalog, roleCtx);
    }
    async loadOrWarm(appClientId, agentId) {
        const dbRevision = await this.fetchRevisionFromDb(appClientId, agentId);
        const cached = await this.catalogStore.get(appClientId, agentId);
        if (cached && cached.revision === dbRevision) {
            (0, runtime_cache_observability_util_1.logRuntimeCacheEvent)({
                layer: 'L2',
                operation: 'loadAgentToolCatalog',
                cacheHit: true,
                agentId,
                appClientId,
            });
            return cached;
        }
        if (cached && cached.revision !== dbRevision) {
            this.logger.debug(`tool catalog revision mismatch agentId=${agentId}, refreshing`);
            return this.refresh(appClientId, agentId);
        }
        const built = await this.buildFromDb(appClientId, agentId);
        if (!built) {
            return null;
        }
        await this.catalogStore.trySet(built);
        (0, runtime_cache_observability_util_1.logRuntimeCacheEvent)({
            layer: 'L2',
            operation: 'loadAgentToolCatalog',
            cacheHit: false,
            agentId,
            appClientId,
        });
        return built;
    }
    async refresh(appClientId, agentId) {
        const built = await this.buildFromDb(appClientId, agentId);
        if (!built) {
            await this.catalogStore.delete(appClientId, agentId);
            return null;
        }
        await this.catalogStore.trySet(built);
        return built;
    }
    async fetchRevisionFromDb(appClientId, agentId) {
        const ctx = await this.loadToolCatalogContext(appClientId, agentId);
        if (!ctx) {
            return '';
        }
        const { tools: toolsPart, integrations } = (0, runtime_revision_util_1.buildToolsRuntimeRevision)(ctx.revisionToolRows);
        return `${toolsPart}|${integrations}|r:${ctx.agent.restrictTools ? 1 : 0}`;
    }
    async fetchRuntimeRevisionParts(appClientId, agentId) {
        const ctx = await this.loadToolCatalogContext(appClientId, agentId);
        if (!ctx) {
            return { tools: '', integrations: '' };
        }
        return (0, runtime_revision_util_1.buildToolsRuntimeRevision)(ctx.revisionToolRows);
    }
    async buildFromDb(appClientId, agentId) {
        const ctx = await this.loadToolCatalogContext(appClientId, agentId);
        if (!ctx) {
            return null;
        }
        const tools = ctx.candidateToolIds.length === 0
            ? []
            : await this.prisma.tool.findMany({
                where: {
                    id: { in: ctx.candidateToolIds },
                    appClientId,
                },
                include: agent_tool_catalog_types_1.AGENT_TOOL_CATALOG_INCLUDE,
                orderBy: { id: 'asc' },
            });
        const revision = await this.fetchRevisionFromDb(appClientId, agentId);
        return {
            appClientId,
            agentId,
            revision,
            agentBoundToolIds: ctx.candidateToolIds,
            tools,
            warmedAt: new Date().toISOString(),
        };
    }
    async loadToolCatalogContext(appClientId, agentId) {
        const agent = await this.prisma.agent.findFirst({
            where: { id: agentId, appClientId },
            select: { id: true, restrictTools: true },
        });
        if (!agent) {
            return null;
        }
        const [agentBindings, appActiveTools] = await Promise.all([
            this.prisma.agentTool.findMany({
                where: { agentId },
                select: { toolId: true },
                orderBy: { toolId: 'asc' },
            }),
            this.prisma.tool.findMany({
                where: { appClientId, isActive: true },
                select: {
                    id: true,
                    updatedAt: true,
                    integration: { select: { id: true, updatedAt: true } },
                },
                orderBy: { id: 'asc' },
            }),
        ]);
        const candidateToolIds = (0, capability_candidate_util_1.resolveAgentToolCandidateIds)({
            restrictTools: agent.restrictTools,
            whitelistIds: agentBindings.map((row) => row.toolId),
            appActiveIds: appActiveTools.map((row) => row.id),
        });
        const candidateSet = new Set(candidateToolIds);
        const revisionToolRows = appActiveTools.filter((row) => candidateSet.has(row.id));
        return {
            agent,
            candidateToolIds,
            revisionToolRows,
        };
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
        const roleToolIds = userApp.role.roleTools.map((row) => row.toolId);
        return {
            roleId: userApp.roleId,
            maxLevel: (0, agent_client_access_util_1.resolveMaxToolLevel)([userApp.role.allowToolLevel]),
            roleToolIds,
        };
    }
};
AgentToolCatalogService = AgentToolCatalogService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        agent_tool_catalog_store_1.AgentToolCatalogStore])
], AgentToolCatalogService);
exports.AgentToolCatalogService = AgentToolCatalogService;
//# sourceMappingURL=agent-tool-catalog.service.js.map