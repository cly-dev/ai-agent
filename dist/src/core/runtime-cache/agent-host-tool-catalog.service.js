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
var AgentHostToolCatalogService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentHostToolCatalogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const host_tool_types_1 = require("../../modules/host-tool/host-tool.types");
const agent_host_tool_catalog_store_1 = require("./agent-host-tool-catalog.store");
const host_tool_catalog_resolve_util_1 = require("./host-tool-catalog-resolve.util");
const capability_candidate_util_1 = require("./capability-candidate.util");
const runtime_cache_observability_util_1 = require("./runtime-cache-observability.util");
const runtime_revision_util_1 = require("./runtime-revision.util");
const client_1 = require("../../../generated/prisma/client");
const LLM_SKILL_TRIGGERS = [
    client_1.HostToolSkillTrigger.LLM_SCOPED,
    client_1.HostToolSkillTrigger.ON_PLAN_STEP,
];
let AgentHostToolCatalogService = AgentHostToolCatalogService_1 = class AgentHostToolCatalogService {
    constructor(prisma, catalogStore) {
        this.prisma = prisma;
        this.catalogStore = catalogStore;
        this.logger = new common_1.Logger(AgentHostToolCatalogService_1.name);
    }
    async loadOrWarm(appClientId, agentId) {
        const dbRevision = await this.fetchRevisionFromDb(appClientId, agentId);
        const cached = await this.catalogStore.get(appClientId, agentId);
        if (cached && cached.revision === dbRevision) {
            return cached;
        }
        if (cached && cached.revision !== dbRevision) {
            this.logger.debug(`host-tool catalog revision mismatch agentId=${agentId}, refreshing`);
            return this.refresh(appClientId, agentId);
        }
        const built = await this.buildFromDb(appClientId, agentId);
        if (!built) {
            return null;
        }
        await this.catalogStore.trySet(built);
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
    async resolveLlmHostTools(input) {
        const pageScope = input.pageScope.trim();
        if (!pageScope) {
            return { tools: [], fromCache: false };
        }
        const before = await this.catalogStore.get(input.appClientId, input.agentId);
        const catalog = await this.loadOrWarm(input.appClientId, input.agentId);
        if (!catalog) {
            return { tools: [], fromCache: false };
        }
        const fromCache = (before === null || before === void 0 ? void 0 : before.revision) === catalog.revision;
        if (fromCache) {
            (0, runtime_cache_observability_util_1.logRuntimeCacheEvent)({
                layer: 'L2',
                operation: 'resolveLlmHostTools',
                cacheHit: true,
                agentId: input.agentId,
                appClientId: input.appClientId,
            });
        }
        else {
            (0, runtime_cache_observability_util_1.logRuntimeCacheEvent)({
                layer: 'L2',
                operation: 'resolveLlmHostTools',
                cacheHit: false,
                agentId: input.agentId,
                appClientId: input.appClientId,
            });
        }
        return {
            tools: (0, host_tool_catalog_resolve_util_1.resolveLlmHostToolsFromCatalog)(catalog, {
                pageScope,
                skillId: input.skillId,
                skillTriggers: LLM_SKILL_TRIGGERS,
            }),
            fromCache,
        };
    }
    async warmPageLlmTools(input) {
        const result = await this.resolveLlmHostTools({
            appClientId: input.appClientId,
            agentId: input.agentId,
            skillId: null,
            pageScope: input.pageScope,
        });
        return result.tools;
    }
    async fetchRevisionFromDb(appClientId, agentId) {
        const ctx = await this.loadHostToolCatalogContext(appClientId, agentId);
        if (!ctx) {
            return '';
        }
        return (0, runtime_revision_util_1.buildHostToolCatalogRevision)({
            hostTools: ctx.revisionHostToolRows,
            hostPages: ctx.revisionHostPageRows,
            skillBindings: ctx.revisionSkillBindingRows,
            agentBoundHostToolIds: ctx.candidateHostToolIds,
        });
    }
    async buildFromDb(appClientId, agentId) {
        const ctx = await this.loadHostToolCatalogContext(appClientId, agentId);
        if (!ctx) {
            return null;
        }
        if (ctx.candidateHostToolIds.length === 0) {
            return {
                appClientId,
                agentId,
                revision: (0, runtime_revision_util_1.buildHostToolCatalogRevision)({
                    hostTools: [],
                    hostPages: [],
                    skillBindings: [],
                    agentBoundHostToolIds: [],
                }),
                agentBoundHostToolIds: [],
                agentBoundTools: [],
                skillBindings: [],
                warmedAt: new Date().toISOString(),
            };
        }
        const [hostToolRows, skillBindingRows] = await Promise.all([
            this.prisma.hostTool.findMany({
                where: {
                    id: { in: ctx.candidateHostToolIds },
                    appClientId,
                },
                include: host_tool_types_1.HOST_TOOL_DETAIL_INCLUDE,
                orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
            }),
            this.prisma.skillHostTool.findMany({
                where: {
                    hostToolId: { in: ctx.candidateHostToolIds },
                    skill: { appClientId },
                },
                orderBy: [{ priority: 'asc' }, { id: 'asc' }],
                select: {
                    id: true,
                    skillId: true,
                    hostToolId: true,
                    trigger: true,
                    isRequired: true,
                    priority: true,
                    argsTemplate: true,
                    updatedAt: true,
                },
            }),
        ]);
        const agentBoundTools = hostToolRows.map((tool) => {
            var _a, _b;
            return ({
                hostToolId: tool.id,
                definitionKey: tool.definitionKey,
                name: tool.name,
                description: tool.description,
                hostPageScope: (_b = (_a = tool.hostPage) === null || _a === void 0 ? void 0 : _a.scope) !== null && _b !== void 0 ? _b : null,
                argsSchema: tool.argsSchema &&
                    typeof tool.argsSchema === 'object' &&
                    !Array.isArray(tool.argsSchema)
                    ? tool.argsSchema
                    : { type: 'object' },
                argsTemplate: tool.argsTemplate,
                config: tool.config,
                isActive: tool.isActive,
                updatedAt: (0, runtime_revision_util_1.toRevisionIso)(tool.updatedAt),
            });
        });
        const skillBindings = skillBindingRows.map((row) => ({
            skillId: row.skillId,
            hostToolId: row.hostToolId,
            trigger: row.trigger,
            isRequired: row.isRequired,
            priority: row.priority,
            argsTemplate: row.argsTemplate,
            updatedAt: (0, runtime_revision_util_1.toRevisionIso)(row.updatedAt),
        }));
        return {
            appClientId,
            agentId,
            revision: (0, runtime_revision_util_1.buildHostToolCatalogRevision)({
                hostTools: hostToolRows.map((row) => ({
                    id: row.id,
                    updatedAt: row.updatedAt,
                })),
                hostPages: hostToolRows
                    .filter((row) => row.hostPage != null)
                    .map((row) => ({
                    id: row.hostPage.id,
                    updatedAt: row.hostPage.updatedAt,
                })),
                skillBindings: skillBindingRows.map((row) => ({
                    id: row.id,
                    updatedAt: row.updatedAt,
                })),
                agentBoundHostToolIds: ctx.candidateHostToolIds,
            }),
            agentBoundHostToolIds: ctx.candidateHostToolIds,
            agentBoundTools,
            skillBindings,
            warmedAt: new Date().toISOString(),
        };
    }
    async loadHostToolCatalogContext(appClientId, agentId) {
        const agent = await this.prisma.agent.findFirst({
            where: { id: agentId, appClientId },
            select: { id: true, restrictHostTools: true },
        });
        if (!agent) {
            return null;
        }
        const [agentBindings, appActiveHostTools] = await Promise.all([
            this.prisma.agentHostTool.findMany({
                where: { agentId },
                select: { hostToolId: true },
                orderBy: { hostToolId: 'asc' },
            }),
            this.prisma.hostTool.findMany({
                where: { appClientId, isActive: true },
                select: {
                    id: true,
                    updatedAt: true,
                    hostPage: { select: { id: true, updatedAt: true } },
                },
                orderBy: { id: 'asc' },
            }),
        ]);
        const candidateHostToolIds = (0, capability_candidate_util_1.resolveAgentHostToolCandidateIds)({
            restrictHostTools: agent.restrictHostTools,
            whitelistIds: agentBindings.map((row) => row.hostToolId),
            appActiveIds: appActiveHostTools.map((row) => row.id),
        });
        const candidateSet = new Set(candidateHostToolIds);
        const revisionHostToolRows = appActiveHostTools.filter((row) => candidateSet.has(row.id));
        const revisionHostPageRows = revisionHostToolRows
            .filter((row) => row.hostPage != null)
            .map((row) => ({
            id: row.hostPage.id,
            updatedAt: row.hostPage.updatedAt,
        }));
        let revisionSkillBindingRows = [];
        if (candidateHostToolIds.length > 0) {
            revisionSkillBindingRows = await this.prisma.skillHostTool.findMany({
                where: {
                    hostToolId: { in: candidateHostToolIds },
                    skill: { appClientId },
                },
                select: { id: true, updatedAt: true },
                orderBy: { id: 'asc' },
            });
        }
        return {
            candidateHostToolIds,
            revisionHostToolRows,
            revisionHostPageRows,
            revisionSkillBindingRows,
        };
    }
};
AgentHostToolCatalogService = AgentHostToolCatalogService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        agent_host_tool_catalog_store_1.AgentHostToolCatalogStore])
], AgentHostToolCatalogService);
exports.AgentHostToolCatalogService = AgentHostToolCatalogService;
//# sourceMappingURL=agent-host-tool-catalog.service.js.map