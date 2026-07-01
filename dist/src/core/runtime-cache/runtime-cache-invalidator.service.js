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
var RuntimeCacheInvalidator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeCacheInvalidator = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const agent_host_tool_catalog_store_1 = require("./agent-host-tool-catalog.store");
const agent_tool_catalog_store_1 = require("./agent-tool-catalog.store");
const agent_skill_catalog_store_1 = require("./agent-skill-catalog.store");
const run_scope_cache_service_1 = require("./run-scope-cache.service");
const tool_category_cache_service_1 = require("./tool-category-cache.service");
let RuntimeCacheInvalidator = RuntimeCacheInvalidator_1 = class RuntimeCacheInvalidator {
    constructor(prisma, hostToolCatalogStore, agentToolCatalogStore, agentSkillCatalogStore, runScopeCache, toolCategoryCache) {
        this.prisma = prisma;
        this.hostToolCatalogStore = hostToolCatalogStore;
        this.agentToolCatalogStore = agentToolCatalogStore;
        this.agentSkillCatalogStore = agentSkillCatalogStore;
        this.runScopeCache = runScopeCache;
        this.toolCategoryCache = toolCategoryCache;
        this.logger = new common_1.Logger(RuntimeCacheInvalidator_1.name);
        this.sessionRuntimeHooks = null;
        this.sessionScopeHooks = null;
    }
    registerSessionRuntimeHooks(hooks) {
        this.sessionRuntimeHooks = hooks;
    }
    registerSessionScopeHooks(hooks) {
        this.sessionScopeHooks = hooks;
    }
    async invalidateForAgent(input) {
        var _a, _b, _c;
        const sessionIds = (_b = (await ((_a = this.sessionRuntimeHooks) === null || _a === void 0 ? void 0 : _a.invalidateSnapshotsForAgent(input.agentId)))) !== null && _b !== void 0 ? _b : [];
        (_c = this.sessionScopeHooks) === null || _c === void 0 ? void 0 : _c.invalidateCachesForAgent(input.agentId, sessionIds);
        if (sessionIds.length > 0) {
            this.logger.log(`invalidated ${sessionIds.length} session runtime snapshot(s) for agentId=${input.agentId}`);
        }
        if (input.appClientId != null) {
            await this.deleteAgentL2Catalogs(input.appClientId, input.agentId);
        }
        else {
            const agent = await this.prisma.agent.findUnique({
                where: { id: input.agentId },
                select: { appClientId: true },
            });
            if (agent) {
                await this.deleteAgentL2Catalogs(agent.appClientId, input.agentId);
            }
        }
    }
    async deleteAgentL2Catalogs(appClientId, agentId) {
        await Promise.all([
            this.hostToolCatalogStore.delete(appClientId, agentId),
            this.agentToolCatalogStore.delete(appClientId, agentId),
            this.agentSkillCatalogStore.deleteForAgent(appClientId, agentId),
        ]);
    }
    async invalidateForAppClient(appClientId) {
        const agents = await this.prisma.agent.findMany({
            where: { appClientId },
            select: { id: true },
        });
        await Promise.all(agents.map((agent) => this.invalidateForAgent({ agentId: agent.id, appClientId })));
    }
    async invalidateForTools(toolIds) {
        var _a, _b;
        if (toolIds.length === 0) {
            return;
        }
        (_a = this.sessionScopeHooks) === null || _a === void 0 ? void 0 : _a.invalidateCachesReferencingToolIds(toolIds);
        await ((_b = this.sessionRuntimeHooks) === null || _b === void 0 ? void 0 : _b.invalidateSnapshotsContainingToolIds(toolIds));
        const appRows = await this.prisma.tool.findMany({
            where: { id: { in: toolIds } },
            select: { appClientId: true },
            distinct: ['appClientId'],
        });
        await Promise.all(appRows.map((row) => this.invalidateForAppClient(row.appClientId)));
    }
    async invalidateForHostTools(hostToolIds) {
        if (hostToolIds.length === 0) {
            return;
        }
        const appRows = await this.prisma.hostTool.findMany({
            where: { id: { in: hostToolIds } },
            select: { appClientId: true },
            distinct: ['appClientId'],
        });
        await Promise.all(appRows.map((row) => this.invalidateForAppClient(row.appClientId)));
    }
    async invalidateForSkillAgent(agentId, appClientId) {
        await this.invalidateForAppClient(appClientId);
    }
    async invalidateForIntegration(integrationId) {
        const tools = await this.prisma.tool.findMany({
            where: { integrationId },
            select: { id: true },
        });
        await this.invalidateForTools(tools.map((row) => row.id));
    }
    invalidateForSession(sessionId) {
        var _a, _b;
        (_a = this.sessionScopeHooks) === null || _a === void 0 ? void 0 : _a.invalidateCachesForSession(sessionId);
        void ((_b = this.sessionRuntimeHooks) === null || _b === void 0 ? void 0 : _b.deleteSession(sessionId));
        this.runScopeCache.clearForSession(sessionId);
    }
    clearRunScope(runId) {
        this.runScopeCache.clearHostToolsForRun(runId);
    }
    invalidateToolCategories() {
        this.toolCategoryCache.clearAll();
    }
};
RuntimeCacheInvalidator = RuntimeCacheInvalidator_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        agent_host_tool_catalog_store_1.AgentHostToolCatalogStore,
        agent_tool_catalog_store_1.AgentToolCatalogStore,
        agent_skill_catalog_store_1.AgentSkillCatalogStore,
        run_scope_cache_service_1.RunScopeCacheService,
        tool_category_cache_service_1.ToolCategoryCacheService])
], RuntimeCacheInvalidator);
exports.RuntimeCacheInvalidator = RuntimeCacheInvalidator;
//# sourceMappingURL=runtime-cache-invalidator.service.js.map