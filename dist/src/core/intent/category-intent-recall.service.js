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
var CategoryIntentRecallService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryIntentRecallService = void 0;
const common_1 = require("@nestjs/common");
const llm_service_1 = require("../llm/llm.service");
const intent_recall_config_service_1 = require("./intent-recall-config.service");
const tool_agent_metadata_util_1 = require("../tool-engine/tool-agent-metadata.util");
const vector_util_1 = require("./vector.util");
let CategoryIntentRecallService = CategoryIntentRecallService_1 = class CategoryIntentRecallService {
    constructor(llmService, intentRecallConfig) {
        this.llmService = llmService;
        this.intentRecallConfig = intentRecallConfig;
        this.logger = new common_1.Logger(CategoryIntentRecallService_1.name);
        this.categoryVectorCache = new Map();
        this.toolVectorCache = new Map();
    }
    async recallTopCategories(categories, userMessage, topK) {
        const query = userMessage.trim();
        if (categories.length === 0 || !query) {
            const defaults = await this.intentRecallConfig.get();
            this.logger.debug('intent category recall skipped: empty categories or query');
            return {
                matchedCategoryIds: [],
                matches: [],
                source: 'none',
                debug: {
                    mode: 'none',
                    topK: topK !== null && topK !== void 0 ? topK : defaults.vectorTopK,
                    minScore: defaults.vectorMinScore,
                    candidateCount: categories.length,
                    scoredTop: [],
                },
            };
        }
        const recallSettings = await this.intentRecallConfig.get();
        const limit = topK !== null && topK !== void 0 ? topK : recallSettings.vectorTopK;
        const minScore = recallSettings.vectorMinScore;
        const recallMode = await this.intentRecallConfig.resolveRecallMode(await this.llmService.isEmbeddingConfigured());
        this.logger.debug(`intent category recall start query="${query}" candidates=${categories.length} topK=${limit} minScore=${minScore} mode=${recallMode.useVector ? 'vector' : 'keyword'}`);
        if (!recallMode.useVector) {
            const scoredTop = categories
                .map((category) => ({
                id: category.id,
                label: category.label,
                score: (0, vector_util_1.keywordRecallScore)(query, category),
                source: 'keyword',
            }))
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
            const result = this.keywordRecall(categories, query, limit, minScore);
            result.debug = {
                mode: 'keyword',
                topK: limit,
                minScore,
                candidateCount: categories.length,
                scoredTop,
            };
            this.logger.debug(`intent category recall mode reason: ${recallMode.reason}`);
            this.logCategoryRecallResult(query, result, minScore, categories.length);
            return result;
        }
        try {
            const queryVector = (await this.llmService.embedTexts([query]))[0];
            if (!queryVector) {
                throw new Error('empty query embedding');
            }
            await this.ensureCategoryVectors(categories);
            const scored = categories
                .map((category) => {
                const cached = this.categoryVectorCache.get(category.id);
                const score = cached
                    ? (0, vector_util_1.cosineSimilarity)(queryVector, cached.vector)
                    : 0;
                return {
                    id: category.id,
                    label: category.label,
                    score,
                    source: 'vector',
                };
            })
                .sort((a, b) => b.score - a.score);
            this.logger.debug(`intent category recall scored(vector) top=${scored
                .slice(0, Math.min(8, scored.length))
                .map((item) => `${item.id}:${item.label}:${item.score.toFixed(4)}`)
                .join(', ') || '(none)'}`);
            const matches = scored
                .filter((item) => item.score >= minScore)
                .slice(0, limit);
            const result = this.toRecallResult(matches, 'vector');
            result.debug = {
                mode: 'vector',
                topK: limit,
                minScore,
                candidateCount: categories.length,
                scoredTop: scored.slice(0, limit).map((item) => ({
                    id: item.id,
                    label: item.label,
                    score: item.score,
                    source: item.source,
                })),
            };
            this.logger.debug(`intent category recall mode reason: ${recallMode.reason}`);
            this.logCategoryRecallResult(query, result, minScore, categories.length);
            return result;
        }
        catch (error) {
            const fallback = await this.intentRecallConfig.shouldFallbackToKeywordOnError();
            if (!fallback) {
                throw error;
            }
            this.logger.warn(`category vector recall failed, fallback keyword: ${error instanceof Error ? error.message : String(error)}`);
            const result = this.keywordRecall(categories, query, limit, minScore);
            const scoredTop = categories
                .map((category) => ({
                id: category.id,
                label: category.label,
                score: (0, vector_util_1.keywordRecallScore)(query, category),
                source: 'keyword',
            }))
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
            result.debug = {
                mode: 'keyword',
                topK: limit,
                minScore,
                candidateCount: categories.length,
                scoredTop,
            };
            this.logger.debug(`intent category recall mode reason: ${recallMode.reason}`);
            this.logCategoryRecallResult(query, result, minScore, categories.length);
            return result;
        }
    }
    logCategoryRecallResult(query, result, minScore, candidateCount) {
        this.logger.debug(`intent category recall result query="${query}" source=${result.source} candidates=${candidateCount} minScore=${minScore} matchedIds=[${result.matchedCategoryIds.join(',') || ''}] matches=${result.matches
            .map((m) => `${m.id}:${m.label}:${m.score.toFixed(4)}:${m.source}`)
            .join(', ') || '(none)'}`);
    }
    async recallTopToolsForBind(tools, userMessage, topK, preferredCategoryIds) {
        const query = userMessage.trim();
        const recallSettings = await this.intentRecallConfig.get();
        const limit = topK !== null && topK !== void 0 ? topK : recallSettings.bindToolsMax;
        if (tools.length === 0) {
            return { tools: [], matches: [], source: 'none', capped: false };
        }
        if (tools.length <= limit) {
            return {
                tools,
                matches: [],
                source: 'none',
                capped: false,
            };
        }
        if (!query) {
            return this.sliceToolsByOrder(tools, limit, 'none');
        }
        const preferred = new Set(preferredCategoryIds !== null && preferredCategoryIds !== void 0 ? preferredCategoryIds : []);
        const recallMode = await this.intentRecallConfig.resolveRecallMode(await this.llmService.isEmbeddingConfigured());
        if (!recallMode.useVector) {
            const ranked = tools
                .map((tool) => {
                let score = (0, vector_util_1.keywordToolRecallScore)(query, tool);
                if (tool.toolCategoryId != null &&
                    preferred.has(tool.toolCategoryId)) {
                    score += CategoryIntentRecallService_1.TOOL_CATEGORY_BOOST;
                }
                return {
                    tool,
                    score,
                    source: 'keyword',
                };
            })
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
            if (this.isNoRelevantBindMatch(ranked)) {
                return { tools: [], matches: [], source: 'keyword', capped: false };
            }
            return this.toToolBindResult(ranked, 'keyword', true);
        }
        try {
            const queryVector = (await this.llmService.embedTexts([query]))[0];
            if (!queryVector) {
                throw new Error('empty query embedding');
            }
            await this.ensureToolVectors(tools);
            const ranked = tools
                .map((tool) => {
                const cached = this.toolVectorCache.get(tool.id);
                let score = cached
                    ? (0, vector_util_1.cosineSimilarity)(queryVector, cached.vector)
                    : 0;
                if (tool.toolCategoryId != null &&
                    preferred.has(tool.toolCategoryId)) {
                    score += CategoryIntentRecallService_1.TOOL_CATEGORY_BOOST;
                }
                return {
                    tool,
                    score,
                    source: 'vector',
                };
            })
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
            if (this.isNoRelevantBindMatch(ranked, recallSettings.vectorMinScore)) {
                return { tools: [], matches: [], source: 'vector', capped: false };
            }
            return this.toToolBindResult(ranked, 'vector', true);
        }
        catch (error) {
            const fallback = await this.intentRecallConfig.shouldFallbackToKeywordOnError();
            if (!fallback) {
                throw error;
            }
            this.logger.warn(`tool bind vector recall failed, fallback keyword: ${error instanceof Error ? error.message : String(error)}`);
            const ranked = tools
                .map((tool) => {
                let score = (0, vector_util_1.keywordToolRecallScore)(query, tool);
                if (tool.toolCategoryId != null &&
                    preferred.has(tool.toolCategoryId)) {
                    score += CategoryIntentRecallService_1.TOOL_CATEGORY_BOOST;
                }
                return {
                    tool,
                    score,
                    source: 'keyword',
                };
            })
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
            if (this.isNoRelevantBindMatch(ranked)) {
                return { tools: [], matches: [], source: 'keyword', capped: false };
            }
            return this.toToolBindResult(ranked, 'keyword', true);
        }
    }
    isNoRelevantBindMatch(ranked, minScore = 0) {
        if (ranked.length === 0) {
            return true;
        }
        const threshold = minScore > 0 ? minScore : 0;
        return ranked.every((item) => item.score <= threshold);
    }
    toToolBindResult(ranked, source, capped) {
        const matches = ranked.map((item) => {
            var _a;
            const description = (_a = item.tool.description) === null || _a === void 0 ? void 0 : _a.trim();
            return Object.assign(Object.assign({ id: item.tool.id, name: item.tool.name }, (description ? { description } : {})), { score: item.score, source: item.source });
        });
        return {
            tools: ranked.map((item) => item.tool),
            matches,
            source,
            capped,
        };
    }
    sliceToolsByOrder(tools, limit, source) {
        const selected = tools.slice(0, limit);
        return {
            tools: selected,
            matches: [],
            source,
            capped: tools.length > limit,
        };
    }
    keywordRecall(categories, query, topK, minScore) {
        const matches = categories
            .map((category) => ({
            id: category.id,
            label: category.label,
            score: (0, vector_util_1.keywordRecallScore)(query, category),
            source: 'keyword',
        }))
            .filter((item) => item.score >= minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
        return this.toRecallResult(matches, 'keyword');
    }
    toRecallResult(matches, source) {
        return {
            matchedCategoryIds: matches.map((item) => item.id),
            matches,
            source,
        };
    }
    async ensureCategoryVectors(categories) {
        const missing = [];
        for (const category of categories) {
            const fingerprint = (0, vector_util_1.buildCategoryEmbedText)(category);
            const cached = this.categoryVectorCache.get(category.id);
            if (!cached || cached.fingerprint !== fingerprint) {
                missing.push(category);
            }
        }
        if (missing.length === 0) {
            return;
        }
        const texts = missing.map((category) => (0, vector_util_1.buildCategoryEmbedText)(category));
        const vectors = await this.llmService.embedTexts(texts);
        for (let index = 0; index < missing.length; index += 1) {
            const category = missing[index];
            const vector = vectors[index];
            if (!vector) {
                continue;
            }
            this.categoryVectorCache.set(category.id, {
                fingerprint: texts[index],
                vector,
            });
        }
    }
    toolEmbedText(tool) {
        if (tool.agentMetadata != null) {
            return (0, tool_agent_metadata_util_1.buildToolEmbedTextFromMetadata)(tool);
        }
        return (0, vector_util_1.buildToolEmbedText)(tool);
    }
    async ensureToolVectors(tools) {
        const missing = [];
        for (const tool of tools) {
            const fingerprint = this.toolEmbedText(tool);
            const cached = this.toolVectorCache.get(tool.id);
            if (!cached || cached.fingerprint !== fingerprint) {
                missing.push(tool);
            }
        }
        if (missing.length === 0) {
            return;
        }
        const texts = missing.map((tool) => this.toolEmbedText(tool));
        const vectors = await this.llmService.embedTexts(texts);
        for (let index = 0; index < missing.length; index += 1) {
            const tool = missing[index];
            const vector = vectors[index];
            if (!vector) {
                continue;
            }
            this.toolVectorCache.set(tool.id, {
                fingerprint: texts[index],
                vector,
            });
        }
    }
};
CategoryIntentRecallService.TOOL_CATEGORY_BOOST = 0.05;
CategoryIntentRecallService = CategoryIntentRecallService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [llm_service_1.LlmService,
        intent_recall_config_service_1.IntentRecallConfigService])
], CategoryIntentRecallService);
exports.CategoryIntentRecallService = CategoryIntentRecallService;
//# sourceMappingURL=category-intent-recall.service.js.map