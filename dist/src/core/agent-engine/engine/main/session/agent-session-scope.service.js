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
exports.AgentSessionScopeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../../prisma/prisma.service");
const session_prepare_store_1 = require("../../../../../modules/chat/session-prepare.store");
const agent_service_1 = require("../../../../../modules/agent/agent.service");
const intent_scope_service_1 = require("../../../../intent/intent-scope.service");
const skill_service_1 = require("../../../../skill/skill.service");
const tool_engine_service_1 = require("../../../../tool-engine/tool-engine.service");
const session_prepare_util_1 = require("../../../../../modules/chat/session-prepare.util");
const runtime_revision_util_1 = require("../../../../runtime-cache/runtime-revision.util");
const runtime_cache_invalidator_service_1 = require("../../../../runtime-cache/runtime-cache-invalidator.service");
const run_scope_cache_service_1 = require("../../../../runtime-cache/run-scope-cache.service");
const tool_category_cache_service_1 = require("../../../../runtime-cache/tool-category-cache.service");
const agent_host_tool_catalog_service_1 = require("../../../../runtime-cache/agent-host-tool-catalog.service");
const runtime_cache_observability_util_1 = require("../../../../runtime-cache/runtime-cache-observability.util");
let AgentSessionScopeService = class AgentSessionScopeService {
    constructor(prisma, agentService, sessionPrepareStore, skillService, intentScopeService, toolEngine, invalidator, runScopeCache, toolCategoryCache, hostToolCatalogService) {
        this.prisma = prisma;
        this.agentService = agentService;
        this.sessionPrepareStore = sessionPrepareStore;
        this.skillService = skillService;
        this.intentScopeService = intentScopeService;
        this.toolEngine = toolEngine;
        this.invalidator = invalidator;
        this.runScopeCache = runScopeCache;
        this.toolCategoryCache = toolCategoryCache;
        this.hostToolCatalogService = hostToolCatalogService;
    }
    onModuleInit() {
        this.invalidator.registerSessionScopeHooks({
            invalidateCachesForAgent: (agentId, sessionIds) => this.invalidateCachesForAgent(agentId, sessionIds),
            invalidateCachesReferencingToolIds: (toolIds) => this.invalidateCachesReferencingToolIds(toolIds),
            invalidateCachesForSession: (sessionId) => this.invalidateCachesForSession(sessionId),
        });
    }
    async fetchToolCategoriesForAllowedTools(toolCategoryIds) {
        return this.toolCategoryCache.fetchByIds(toolCategoryIds);
    }
    async getSessionAllowedTools(sessionId, agentId, userId, appClientId) {
        const freshTools = await this.agentService.getAllowedTools(agentId, userId, appClientId);
        const freshSkills = await this.skillService.listRunnableAgentSkillsForUser({ agentId, userId, appClientId }, new Set(freshTools.map((tool) => tool.id)));
        const skillRows = await this.loadSkillRevisionRows(freshSkills.map((skill) => skill.id));
        const hostToolsRevision = await this.hostToolCatalogService.fetchRevisionFromDb(appClientId, agentId);
        const freshRevision = (0, session_prepare_util_1.buildSessionRuntimeRevision)({
            tools: freshTools,
            skills: skillRows,
            hostToolsRevision,
        });
        const fromRedis = await this.sessionPrepareStore.get(sessionId, userId, appClientId, agentId, freshRevision);
        if (fromRedis &&
            (0, session_prepare_util_1.areSessionRuntimeRevisionsEqual)(fromRedis.revision, freshRevision)) {
            (0, runtime_cache_observability_util_1.logRuntimeCacheEvent)({
                layer: 'L1',
                operation: 'getSessionAllowedTools',
                cacheHit: true,
                sessionId,
                agentId,
                appClientId,
            });
            return fromRedis.tools;
        }
        if (fromRedis) {
            (0, runtime_cache_observability_util_1.logRuntimeCacheEvent)({
                layer: 'L1',
                operation: 'getSessionAllowedTools',
                cacheHit: false,
                revisionMismatch: true,
                sessionId,
                agentId,
                appClientId,
            });
            await this.sessionPrepareStore.delete(sessionId);
        }
        else {
            (0, runtime_cache_observability_util_1.logRuntimeCacheEvent)({
                layer: 'L1',
                operation: 'getSessionAllowedTools',
                cacheHit: false,
                sessionId,
                agentId,
                appClientId,
            });
        }
        void this.sessionPrepareStore.trySet({
            sessionId,
            userId,
            appClientId,
            agentId,
            revision: freshRevision,
            tools: freshTools,
            skills: skillRows,
        });
        return freshTools;
    }
    invalidateCachesForAgent(_agentId, sessionIds) {
        if (sessionIds.length > 0) {
            for (const sessionId of sessionIds) {
                this.invalidateCachesForSession(sessionId);
            }
            return;
        }
        this.runScopeCache.clearAllIntent();
    }
    invalidateCachesReferencingToolIds(toolIds) {
        this.runScopeCache.clearIntentReferencingToolIds(toolIds);
    }
    invalidateCachesForSession(sessionId) {
        this.runScopeCache.clearForSession(sessionId);
    }
    buildToolsRuntimeRevision(tools) {
        return (0, runtime_revision_util_1.buildEntityRevisionsFingerprint)(tools.map((tool) => ({
            id: tool.id,
            updatedAt: 'updatedAt' in tool && tool.updatedAt != null
                ? String(tool.updatedAt)
                : undefined,
        })));
    }
    buildIntentScopeCacheKey(sessionId, matchedCategoryIds, userMessage) {
        const cats = [...matchedCategoryIds].sort((a, b) => a - b).join(',');
        const msg = userMessage.trim().toLowerCase().replace(/\s+/g, ' ');
        return `${sessionId}:intent:${cats || 'none'}:${msg}`;
    }
    async resolveScopedToolsForIntent(input) {
        const toolRevision = this.buildToolsRuntimeRevision(input.tools);
        const cacheKey = this.buildIntentScopeCacheKey(input.sessionId, input.matchedCategoryIds, input.userMessage);
        const cached = this.runScopeCache.getIntentScoped(cacheKey, toolRevision);
        if (cached) {
            (0, runtime_cache_observability_util_1.logRuntimeCacheEvent)({
                layer: 'L0',
                operation: 'resolveScopedToolsForIntent',
                cacheHit: true,
                sessionId: input.sessionId,
            });
            return {
                scopedTools: cached.scopedTools,
                scopedLangChainTools: cached.scopedLangChainTools,
                scopedToolBundle: cached.scopedToolBundle,
                scopedAllowedToolIds: cached.scopedAllowedToolIds,
                bindCap: cached.bindCap,
                fallbackReason: cached.fallbackReason,
                fromCache: true,
            };
        }
        const scoped = await this.scopeToolsForMainLoop(input.tools, input.userMessage, input.toolBuildCtx, input.matchedCategoryIds);
        this.runScopeCache.setIntentScoped(cacheKey, toolRevision, scoped);
        (0, runtime_cache_observability_util_1.logRuntimeCacheEvent)({
            layer: 'L0',
            operation: 'resolveScopedToolsForIntent',
            cacheHit: false,
            sessionId: input.sessionId,
        });
        return Object.assign(Object.assign({}, scoped), { fromCache: false });
    }
    filterToolsByIntent(tools, parsed) {
        if (!parsed.intentClear) {
            return tools;
        }
        const idSet = new Set(parsed.matchedCategoryIds);
        if (idSet.size === 0 && !parsed.includeUncategorized) {
            return tools;
        }
        const narrowed = tools.filter((t) => {
            if (t.toolCategoryId != null && idSet.has(t.toolCategoryId)) {
                return true;
            }
            if (t.toolCategoryId == null && parsed.includeUncategorized) {
                return true;
            }
            return false;
        });
        return narrowed.length > 0 ? narrowed : tools;
    }
    async scopeToolsForMainLoop(tools, userMessage, toolBuildCtx, preferredCategoryIds) {
        var _a;
        const result = await this.intentScopeService.scopeToolsForMainLoop(tools, userMessage, toolBuildCtx, preferredCategoryIds, true);
        const scopedToolBundle = (_a = result.scopedToolBundle) !== null && _a !== void 0 ? _a : this.toolEngine.buildLangChainTools(tools, Object.assign(Object.assign({}, toolBuildCtx), { allowedToolIds: tools.map((tool) => tool.id) }));
        return {
            scopedTools: result.scopedTools,
            scopedLangChainTools: result.scopedLangChainTools,
            scopedToolBundle,
            scopedAllowedToolIds: result.scopedAllowedToolIds,
            bindCap: result.bindCap,
            fallbackReason: result.fallbackReason,
        };
    }
    async loadSkillRevisionRows(skillIds) {
        if (skillIds.length === 0) {
            return [];
        }
        const rows = await this.prisma.skill.findMany({
            where: { id: { in: skillIds } },
            select: { id: true, name: true, updatedAt: true },
            orderBy: { id: 'asc' },
        });
        return rows.map((row) => ({
            id: row.id,
            name: row.name,
            updatedAt: row.updatedAt.toISOString(),
        }));
    }
};
AgentSessionScopeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        agent_service_1.AgentService,
        session_prepare_store_1.SessionPrepareStore,
        skill_service_1.SkillService,
        intent_scope_service_1.IntentScopeService,
        tool_engine_service_1.ToolEngineService,
        runtime_cache_invalidator_service_1.RuntimeCacheInvalidator,
        run_scope_cache_service_1.RunScopeCacheService,
        tool_category_cache_service_1.ToolCategoryCacheService,
        agent_host_tool_catalog_service_1.AgentHostToolCatalogService])
], AgentSessionScopeService);
exports.AgentSessionScopeService = AgentSessionScopeService;
//# sourceMappingURL=agent-session-scope.service.js.map