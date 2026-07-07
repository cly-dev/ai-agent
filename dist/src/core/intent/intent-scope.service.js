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
var IntentScopeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentScopeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const tool_agent_metadata_util_1 = require("../tool-engine/tool-agent-metadata.util");
const tool_engine_service_1 = require("../tool-engine/tool-engine.service");
const bind_tools_tier_util_1 = require("./bind-tools-tier.util");
const category_intent_recall_service_1 = require("./category-intent-recall.service");
const intent_recall_config_service_1 = require("./intent-recall-config.service");
const tool_category_cache_service_1 = require("../runtime-cache/tool-category-cache.service");
const intent_kind_util_1 = require("../agent-engine/intent-kind.util");
const intent_scope_util_1 = require("./intent-scope.util");
let IntentScopeService = IntentScopeService_1 = class IntentScopeService {
    constructor(prisma, categoryIntentRecall, intentRecallConfig, toolEngine, toolCategoryCache) {
        this.prisma = prisma;
        this.categoryIntentRecall = categoryIntentRecall;
        this.intentRecallConfig = intentRecallConfig;
        this.toolEngine = toolEngine;
        this.toolCategoryCache = toolCategoryCache;
        this.logger = new common_1.Logger(IntentScopeService_1.name);
    }
    buildIntentClarificationGuidance(userMessage) {
        return (0, intent_scope_util_1.buildIntentClarificationGuidance)(userMessage);
    }
    async resolveIntentScope(input) {
        var _a;
        const intentKind = (0, intent_kind_util_1.detectIntentKind)(input.userMessage, input.smallTalkHints);
        const buildLangChain = input.buildLangChain !== false;
        if (!input.enableToolCall || input.tools.length === 0) {
            return this.buildSkippedScope(input.tools, intentKind, buildLangChain, input.toolBuildCtx);
        }
        if (intentKind === 'smalltalk') {
            return {
                intentKind: 'smalltalk',
                intentClear: true,
                matchedCategoryIds: [],
                includeUncategorized: false,
                scopedTools: [],
                scopedToolIds: [],
                scopedLangChainTools: [],
                scopedToolBundle: null,
                scopedAllowedToolIds: [],
            };
        }
        if (!(0, intent_scope_util_1.isUserIntentClear)(input.userMessage)) {
            const scoped = await this.scopeToolsForMainLoop(input.tools, input.userMessage, input.toolBuildCtx, [], buildLangChain);
            return {
                intentKind: 'unclear',
                intentClear: false,
                matchedCategoryIds: [],
                includeUncategorized: false,
                scopedTools: scoped.scopedTools,
                scopedToolIds: scoped.scopedAllowedToolIds,
                scopedLangChainTools: scoped.scopedLangChainTools,
                scopedToolBundle: scoped.scopedToolBundle,
                scopedAllowedToolIds: scoped.scopedAllowedToolIds,
                bindCap: scoped.bindCap,
                fallbackReason: scoped.fallbackReason,
            };
        }
        const categoryIds = [
            ...new Set(input.tools
                .map((tool) => tool.toolCategoryId)
                .filter((id) => id != null)),
        ];
        const categories = await this.fetchToolCategories(categoryIds);
        let recallResult;
        try {
            recallResult = await this.categoryIntentRecall.recallTopCategories(categories, input.userMessage);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`category intent recall failed: ${message}`);
            const scoped = await this.scopeToolsForMainLoop(input.tools, input.userMessage, input.toolBuildCtx, [], buildLangChain);
            return {
                intentKind: 'task',
                intentClear: true,
                matchedCategoryIds: [],
                includeUncategorized: false,
                scopedTools: scoped.scopedTools,
                scopedToolIds: scoped.scopedAllowedToolIds,
                scopedLangChainTools: scoped.scopedLangChainTools,
                scopedToolBundle: scoped.scopedToolBundle,
                scopedAllowedToolIds: scoped.scopedAllowedToolIds,
                bindCap: scoped.bindCap,
                fallbackReason: (_a = scoped.fallbackReason) !== null && _a !== void 0 ? _a : 'bind_recall_error',
                toolsBeforeIntentNarrow: input.tools.length,
                toolsAfterIntentNarrow: input.tools.length,
            };
        }
        const validCategoryIdSet = new Set(categories.map((category) => category.id));
        const matchedCategoryIds = recallResult.matchedCategoryIds.filter((id) => validCategoryIdSet.has(id));
        const parsed = {
            intentClear: true,
            matchedCategoryIds,
            includeUncategorized: false,
        };
        const narrowed = this.filterToolsByIntent(input.tools, parsed);
        const scoped = await this.scopeToolsForMainLoop(narrowed, input.userMessage, input.toolBuildCtx, matchedCategoryIds, buildLangChain);
        return {
            intentKind: 'task',
            intentClear: true,
            matchedCategoryIds,
            includeUncategorized: false,
            scopedTools: scoped.scopedTools,
            scopedToolIds: scoped.scopedAllowedToolIds,
            scopedLangChainTools: scoped.scopedLangChainTools,
            scopedToolBundle: scoped.scopedToolBundle,
            scopedAllowedToolIds: scoped.scopedAllowedToolIds,
            bindCap: scoped.bindCap,
            fallbackReason: scoped.fallbackReason,
            recallSource: recallResult.source,
            recallMatches: recallResult.matches.map((item) => ({
                id: item.id,
                label: item.label,
                score: Number(item.score.toFixed(4)),
                source: item.source,
            })),
            toolsBeforeIntentNarrow: input.tools.length,
            toolsAfterIntentNarrow: narrowed.length,
        };
    }
    async scopeToolsForMainLoop(tools, userMessage, toolBuildCtx, preferredCategoryIds, buildLangChain = true) {
        var _a;
        const metadataScoped = (0, tool_agent_metadata_util_1.filterToolsByAgentMetadata)(tools, userMessage);
        const recallSettings = await this.intentRecallConfig.get();
        const tierCfg = (0, bind_tools_tier_util_1.readBindToolsTierConfig)(recallSettings);
        const bindTier = (0, bind_tools_tier_util_1.resolveBindToolsTopK)(metadataScoped.length, tierCfg);
        const emptyBundle = () => {
            if (!buildLangChain) {
                return {
                    scopedTools: [],
                    scopedLangChainTools: [],
                    scopedToolBundle: null,
                    scopedAllowedToolIds: [],
                };
            }
            const scopedToolBundle = this.toolEngine.buildLangChainTools([], Object.assign(Object.assign({}, toolBuildCtx), { allowedToolIds: [] }));
            return {
                scopedTools: [],
                scopedLangChainTools: scopedToolBundle.tools,
                scopedToolBundle,
                scopedAllowedToolIds: [],
            };
        };
        const fallbackBundle = () => {
            if (bindTier.recallRequired) {
                return emptyBundle();
            }
            const scopedIds = tools.map((tool) => tool.id);
            if (!buildLangChain) {
                return {
                    scopedTools: tools,
                    scopedLangChainTools: [],
                    scopedToolBundle: null,
                    scopedAllowedToolIds: scopedIds,
                };
            }
            const scopedToolBundle = this.toolEngine.buildLangChainTools(tools, Object.assign(Object.assign({}, toolBuildCtx), { allowedToolIds: scopedIds }));
            return {
                scopedTools: tools,
                scopedLangChainTools: scopedToolBundle.tools,
                scopedToolBundle,
                scopedAllowedToolIds: scopedIds,
            };
        };
        try {
            const bindRecall = await this.categoryIntentRecall.recallTopToolsForBind(metadataScoped.map((tool) => ({
                id: tool.id,
                name: tool.name,
                description: tool.description,
                toolCategoryId: tool.toolCategoryId,
                agentMetadata: tool.agentMetadata,
            })), userMessage, bindTier.topK, preferredCategoryIds);
            const toolById = new Map(metadataScoped.map((tool) => [tool.id, tool]));
            const scopedTools = bindRecall.tools
                .map((row) => toolById.get(row.id))
                .filter((tool) => tool != null);
            const effectiveTools = scopedTools.length > 0
                ? scopedTools
                : bindTier.recallRequired
                    ? []
                    : metadataScoped;
            const scopedIds = effectiveTools.map((tool) => tool.id);
            const scopedToolBundle = buildLangChain
                ? this.toolEngine.buildLangChainTools(effectiveTools, Object.assign(Object.assign({}, toolBuildCtx), { allowedToolIds: scopedIds }))
                : null;
            const bindCap = bindRecall.capped || bindTier.recallRequired
                ? {
                    before: metadataScoped.length,
                    after: effectiveTools.length,
                    source: bindRecall.source,
                    tier: bindTier.tier,
                    tierTopK: bindTier.topK,
                    recallRequired: bindTier.recallRequired,
                    matches: bindRecall.matches.map((item) => (Object.assign(Object.assign({ id: item.id, name: item.name }, (item.description ? { description: item.description } : {})), { score: Number(item.score.toFixed(4)), source: item.source }))),
                }
                : undefined;
            return {
                scopedTools: effectiveTools,
                scopedLangChainTools: (_a = scopedToolBundle === null || scopedToolBundle === void 0 ? void 0 : scopedToolBundle.tools) !== null && _a !== void 0 ? _a : [],
                scopedToolBundle,
                scopedAllowedToolIds: scopedIds,
                bindCap,
                fallbackReason: scopedTools.length === 0 ? 'bind_recall_empty' : undefined,
            };
        }
        catch (error) {
            this.logger.warn(`tool bind recall failed, capped fallback: ${error instanceof Error ? error.message : String(error)}`);
            return Object.assign(Object.assign({}, fallbackBundle()), { fallbackReason: 'bind_recall_error' });
        }
    }
    buildSkippedScope(tools, intentKind, buildLangChain, toolBuildCtx) {
        var _a;
        const scopedToolIds = tools.map((tool) => tool.id);
        const bundle = buildLangChain
            ? this.toolEngine.buildLangChainTools(tools, Object.assign(Object.assign({}, toolBuildCtx), { allowedToolIds: scopedToolIds }))
            : null;
        return {
            intentKind: 'skipped',
            intentClear: true,
            matchedCategoryIds: [],
            includeUncategorized: false,
            scopedTools: tools,
            scopedToolIds,
            scopedLangChainTools: (_a = bundle === null || bundle === void 0 ? void 0 : bundle.tools) !== null && _a !== void 0 ? _a : [],
            scopedToolBundle: bundle,
            scopedAllowedToolIds: scopedToolIds,
        };
    }
    filterToolsByIntent(tools, parsed) {
        if (!parsed.intentClear) {
            return tools;
        }
        const idSet = new Set(parsed.matchedCategoryIds);
        if (idSet.size === 0 && !parsed.includeUncategorized) {
            return tools;
        }
        const narrowed = tools.filter((tool) => {
            if (tool.toolCategoryId != null && idSet.has(tool.toolCategoryId)) {
                return true;
            }
            if (tool.toolCategoryId == null && parsed.includeUncategorized) {
                return true;
            }
            return false;
        });
        return narrowed.length > 0 ? narrowed : tools;
    }
    async fetchToolCategories(toolCategoryIds) {
        return this.toolCategoryCache.fetchByIds(toolCategoryIds);
    }
};
IntentScopeService = IntentScopeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        category_intent_recall_service_1.CategoryIntentRecallService,
        intent_recall_config_service_1.IntentRecallConfigService,
        tool_engine_service_1.ToolEngineService,
        tool_category_cache_service_1.ToolCategoryCacheService])
], IntentScopeService);
exports.IntentScopeService = IntentScopeService;
//# sourceMappingURL=intent-scope.service.js.map