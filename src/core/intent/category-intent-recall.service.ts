import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { IntentRecallConfigService } from './intent-recall-config.service';
import type {
  CategoryRecallMatch,
  CategoryRecallResult,
  ToolBindRecallMatch,
  ToolBindRecallResult,
  ToolBindRecallRow,
  ToolCategoryRecallRow,
} from './intent.types';
import { buildToolEmbedTextFromMetadata } from '../tool-engine/tool-agent-metadata.util';
import {
  buildCategoryEmbedText,
  buildToolEmbedText,
  cosineSimilarity,
  keywordRecallScore,
  keywordToolRecallScore,
} from './vector.util';

/** 进程内类目向量缓存项：文本指纹 + embedding。 */
type CachedCategoryVector = {
  fingerprint: string;
  vector: number[];
};

/** 进程内工具向量缓存项：文本指纹 + embedding。 */
type CachedToolVector = {
  fingerprint: string;
  vector: number[];
};

/**
 * 意图召回核心服务。
 *
 * 职责：
 * 1. 类目 Top-K：根据用户消息匹配 ToolCategory，供 Agent intent 节点收窄工具范围；
 * 2. 工具 Top-K：在类目过滤后进一步截断 bindTools 数量（默认 25）。
 *
 * 向量来源：LlmService.embedTexts（DB transformers_embedding 优先，或 api_embedding / 环境变量）。
 * 降级：embedding 失败且 fallbackToKeyword 时回退关键词 overlap 打分。
 */
@Injectable()
export class CategoryIntentRecallService {
  private readonly logger = new Logger(CategoryIntentRecallService.name);
  /** 类目 id → 向量缓存（进程级，重启失效） */
  private readonly categoryVectorCache = new Map<number, CachedCategoryVector>();
  /** 工具 id → 向量缓存（进程级，重启失效） */
  private readonly toolVectorCache = new Map<number, CachedToolVector>();
  /** 意图已命中类目内的工具，bind 排序时小幅加分，避免跨类目误排靠前 */
  private static readonly TOOL_CATEGORY_BOOST = 0.05;

  constructor(
    private readonly llmService: LlmService,
    private readonly intentRecallConfig: IntentRecallConfigService,
  ) {}

  /**
   * 类目向量 Top-K 召回。
   *
   * @param categories 本轮可用工具关联的 ToolCategory 列表
   * @param userMessage 用户最新消息
   * @param topK 召回上限，默认读 AGENT_INTENT_VECTOR_TOP_K
   * @returns 命中类目 id 及每条 match 的 score / source
   */
  async recallTopCategories(
    categories: ToolCategoryRecallRow[],
    userMessage: string,
    topK?: number,
  ): Promise<CategoryRecallResult> {
    const query = userMessage.trim();
    if (categories.length === 0 || !query) {
      const defaults = await this.intentRecallConfig.get();
      this.logger.debug(
        'intent category recall skipped: empty categories or query',
      );
      return {
        matchedCategoryIds: [],
        matches: [],
        source: 'none',
        debug: {
          mode: 'none',
          topK: topK ?? defaults.vectorTopK,
          minScore: defaults.vectorMinScore,
          candidateCount: categories.length,
          scoredTop: [],
        },
      };
    }

    const recallSettings = await this.intentRecallConfig.get();
    const limit = topK ?? recallSettings.vectorTopK;
    const minScore = recallSettings.vectorMinScore;
    const recallMode = await this.intentRecallConfig.resolveRecallMode(
      await this.llmService.isEmbeddingConfigured(),
    );
    this.logger.debug(
      `intent category recall start query="${query}" candidates=${categories.length} topK=${limit} minScore=${minScore} mode=${
        recallMode.useVector ? 'vector' : 'keyword'
      }`,
    );

    if (!recallMode.useVector) {
      const scoredTop = categories
        .map((category) => ({
          id: category.id,
          label: category.label,
          score: keywordRecallScore(query, category),
          source: 'keyword' as const,
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
            ? cosineSimilarity(queryVector, cached.vector)
            : 0;
          return {
            id: category.id,
            label: category.label,
            score,
            source: 'vector' as const,
          };
        })
        .sort((a, b) => b.score - a.score);
      this.logger.debug(
        `intent category recall scored(vector) top=${
          scored
            .slice(0, Math.min(8, scored.length))
            .map((item) => `${item.id}:${item.label}:${item.score.toFixed(4)}`)
            .join(', ') || '(none)'
        }`,
      );
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
    } catch (error) {
      const fallback = await this.intentRecallConfig.shouldFallbackToKeywordOnError();
      if (!fallback) {
        throw error;
      }
      this.logger.warn(
        `category vector recall failed, fallback keyword: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      const result = this.keywordRecall(categories, query, limit, minScore);
      const scoredTop = categories
        .map((category) => ({
          id: category.id,
          label: category.label,
          score: keywordRecallScore(query, category),
          source: 'keyword' as const,
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

  private logCategoryRecallResult(
    query: string,
    result: CategoryRecallResult,
    minScore: number,
    candidateCount: number,
  ): void {
    this.logger.debug(
      `intent category recall result query="${query}" source=${result.source} candidates=${candidateCount} minScore=${minScore} matchedIds=[${
        result.matchedCategoryIds.join(',') || ''
      }] matches=${
        result.matches
          .map((m) => `${m.id}:${m.label}:${m.score.toFixed(4)}:${m.source}`)
          .join(', ') || '(none)'
      }`,
    );
  }

  /**
   * 主循环 bindTools Top-K 召回。
   *
   * 当候选工具数超过 AGENT_BIND_TOOLS_MAX 时，按与用户消息的相似度排序并截断。
   * preferredCategoryIds 中的类目所属工具会获得额外加分。
   *
   * @param tools 已通过权限 + 类目过滤的工具列表
   * @param userMessage 用户最新消息
   * @param topK bind 上限，默认读 AGENT_BIND_TOOLS_MAX
   * @param preferredCategoryIds 意图阶段已命中的类目 id（可选）
   */
  async recallTopToolsForBind(
    tools: ToolBindRecallRow[],
    userMessage: string,
    topK?: number,
    preferredCategoryIds?: number[],
  ): Promise<ToolBindRecallResult> {
    const query = userMessage.trim();
    const recallSettings = await this.intentRecallConfig.get();
    const limit = topK ?? recallSettings.bindToolsMax;
    if (tools.length === 0) {
      return { tools: [], matches: [], source: 'none', capped: false };
    }
    // 未超上限：原样返回，不做 embedding
    if (tools.length <= limit) {
      return {
        tools,
        matches: [],
        source: 'none',
        capped: false,
      };
    }
    // 无用户文本时按原顺序截断
    if (!query) {
      return this.sliceToolsByOrder(tools, limit, 'none');
    }

    const preferred = new Set(preferredCategoryIds ?? []);
    const recallMode = await this.intentRecallConfig.resolveRecallMode(
      await this.llmService.isEmbeddingConfigured(),
    );
    if (!recallMode.useVector) {
      const ranked = tools
        .map((tool) => {
          let score = keywordToolRecallScore(query, tool);
          if (
            tool.toolCategoryId != null &&
            preferred.has(tool.toolCategoryId)
          ) {
            score += CategoryIntentRecallService.TOOL_CATEGORY_BOOST;
          }
          return {
            tool,
            score,
            source: 'keyword' as const,
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
            ? cosineSimilarity(queryVector, cached.vector)
            : 0;
          if (
            tool.toolCategoryId != null &&
            preferred.has(tool.toolCategoryId)
          ) {
            score += CategoryIntentRecallService.TOOL_CATEGORY_BOOST;
          }
          return {
            tool,
            score,
            source: 'vector' as const,
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      if (this.isNoRelevantBindMatch(ranked, recallSettings.vectorMinScore)) {
        return { tools: [], matches: [], source: 'vector', capped: false };
      }
      return this.toToolBindResult(ranked, 'vector', true);
    } catch (error) {
      const fallback = await this.intentRecallConfig.shouldFallbackToKeywordOnError();
      if (!fallback) {
        throw error;
      }
      this.logger.warn(
        `tool bind vector recall failed, fallback keyword: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      const ranked = tools
        .map((tool) => {
          let score = keywordToolRecallScore(query, tool);
          if (
            tool.toolCategoryId != null &&
            preferred.has(tool.toolCategoryId)
          ) {
            score += CategoryIntentRecallService.TOOL_CATEGORY_BOOST;
          }
          return {
            tool,
            score,
            source: 'keyword' as const,
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

  /** 召回结果均无有效相关度时，不强行绑定工具（避免「你好」等输入随机绑 25 个 API）。 */
  private isNoRelevantBindMatch(
    ranked: Array<{ score: number }>,
    minScore = 0,
  ): boolean {
    if (ranked.length === 0) {
      return true;
    }
    const threshold = minScore > 0 ? minScore : 0;
    return ranked.every((item) => item.score <= threshold);
  }

  /** 将排序后的工具列表封装为 ToolBindRecallResult。 */
  private toToolBindResult(
    ranked: Array<{
      tool: ToolBindRecallRow;
      score: number;
      source: 'vector' | 'keyword';
    }>,
    source: ToolBindRecallResult['source'],
    capped: boolean,
  ): ToolBindRecallResult {
    const matches: ToolBindRecallMatch[] = ranked.map((item) => ({
      id: item.tool.id,
      name: item.tool.name,
      score: item.score,
      source: item.source,
    }));
    return {
      tools: ranked.map((item) => item.tool),
      matches,
      source,
      capped,
    };
  }

  /** 无 query 向量时按输入顺序截断（兜底）。 */
  private sliceToolsByOrder(
    tools: ToolBindRecallRow[],
    limit: number,
    source: ToolBindRecallResult['source'],
  ): ToolBindRecallResult {
    const selected = tools.slice(0, limit);
    return {
      tools: selected,
      matches: [],
      source,
      capped: tools.length > limit,
    };
  }

  /** 类目召回的关键词降级：分词 overlap + minScore 过滤。 */
  private keywordRecall(
    categories: ToolCategoryRecallRow[],
    query: string,
    topK: number,
    minScore: number,
  ): CategoryRecallResult {
    const matches = categories
      .map((category) => ({
        id: category.id,
        label: category.label,
        score: keywordRecallScore(query, category),
        source: 'keyword' as const,
      }))
      .filter((item) => item.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
    return this.toRecallResult(matches, 'keyword');
  }

  /** 将 CategoryRecallMatch 列表转为 CategoryRecallResult。 */
  private toRecallResult(
    matches: CategoryRecallMatch[],
    source: CategoryRecallResult['source'],
  ): CategoryRecallResult {
    return {
      matchedCategoryIds: matches.map((item) => item.id),
      matches,
      source,
    };
  }

  /**
   * 懒加载类目 embedding：仅对缓存缺失或文本变更的类目批量 embed。
   * fingerprint = buildCategoryEmbedText(category)。
   */
  private async ensureCategoryVectors(
    categories: ToolCategoryRecallRow[],
  ): Promise<void> {
    const missing: ToolCategoryRecallRow[] = [];
    for (const category of categories) {
      const fingerprint = buildCategoryEmbedText(category);
      const cached = this.categoryVectorCache.get(category.id);
      if (!cached || cached.fingerprint !== fingerprint) {
        missing.push(category);
      }
    }
    if (missing.length === 0) {
      return;
    }
    const texts = missing.map((category) => buildCategoryEmbedText(category));
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

  /**
   * 懒加载工具 embedding：仅对缓存缺失或 name/description 变更的工具批量 embed。
   */
  private toolEmbedText(tool: ToolBindRecallRow): string {
    if (tool.agentMetadata != null) {
      return buildToolEmbedTextFromMetadata(tool);
    }
    return buildToolEmbedText(tool);
  }

  private async ensureToolVectors(tools: ToolBindRecallRow[]): Promise<void> {
    const missing: ToolBindRecallRow[] = [];
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

}
