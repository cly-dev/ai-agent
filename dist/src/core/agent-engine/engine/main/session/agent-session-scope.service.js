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
const session_runtime_resolver_service_1 = require("../../../../../modules/chat/session-runtime-resolver.service");
const intent_scope_service_1 = require("../../../../intent/intent-scope.service");
const tool_engine_service_1 = require("../../../../tool-engine/tool-engine.service");
const runtime_revision_util_1 = require("../../../../runtime-cache/runtime-revision.util");
const runtime_cache_observability_util_1 = require("../../../../runtime-cache/runtime-cache-observability.util");
const runtime_cache_invalidator_service_1 = require("../../../../runtime-cache/runtime-cache-invalidator.service");
const run_scope_cache_service_1 = require("../../../../runtime-cache/run-scope-cache.service");
const tool_category_cache_service_1 = require("../../../../runtime-cache/tool-category-cache.service");
let AgentSessionScopeService = class AgentSessionScopeService {
    constructor(sessionRuntimeResolver, intentScopeService, toolEngine, invalidator, runScopeCache, toolCategoryCache) {
        this.sessionRuntimeResolver = sessionRuntimeResolver;
        this.intentScopeService = intentScopeService;
        this.toolEngine = toolEngine;
        this.invalidator = invalidator;
        this.runScopeCache = runScopeCache;
        this.toolCategoryCache = toolCategoryCache;
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
        const bundle = await this.sessionRuntimeResolver.resolveAllowedToolsBundle({
            sessionId,
            agentId,
            userId,
            appClientId,
        });
        return bundle.tools;
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
        this.sessionRuntimeResolver.invalidateSession(sessionId);
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
};
AgentSessionScopeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [session_runtime_resolver_service_1.SessionRuntimeResolverService,
        intent_scope_service_1.IntentScopeService,
        tool_engine_service_1.ToolEngineService,
        runtime_cache_invalidator_service_1.RuntimeCacheInvalidator,
        run_scope_cache_service_1.RunScopeCacheService,
        tool_category_cache_service_1.ToolCategoryCacheService])
], AgentSessionScopeService);
exports.AgentSessionScopeService = AgentSessionScopeService;
//# sourceMappingURL=agent-session-scope.service.js.map