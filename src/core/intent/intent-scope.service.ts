import { Injectable, Logger } from '@nestjs/common';
import type { DynamicStructuredTool } from '@langchain/core/tools';
import { PrismaService } from '../../prisma/prisma.service';
import { filterToolsByAgentMetadata } from '../tool-engine/tool-agent-metadata.util';
import { ToolEngineService } from '../tool-engine/tool-engine.service';
import type {
  BuiltLangChainTools,
  ToolBuildContext,
} from '../tool-engine/tool-engine.types';
import { CategoryIntentRecallService } from './category-intent-recall.service';
import { detectIntentKind as classifyIntentKind } from '../agent-engine/intent-kind.util';
import {
  buildIntentClarificationGuidance,
  isUserIntentClear,
} from './intent-scope.util';
import type {
  IntentScopeTool,
  ResolveIntentScopeInput,
  ResolvedIntentScope,
} from './intent-scope.types';

type ParsedIntentPayload = {
  intentClear: boolean;
  matchedCategoryIds: number[];
  includeUncategorized: boolean;
};

@Injectable()
export class IntentScopeService {
  private readonly logger = new Logger(IntentScopeService.name);
  private readonly toolCategoryRowsCache = new Map<
    string,
    {
      rows: Array<{ id: number; label: string; description: string | null }>;
      expiresAt: number;
    }
  >();
  private static readonly CATEGORY_CACHE_TTL_MS = 10 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly categoryIntentRecall: CategoryIntentRecallService,
    private readonly toolEngine: ToolEngineService,
  ) {}

  buildIntentClarificationGuidance(userMessage: string): string {
    return buildIntentClarificationGuidance(userMessage);
  }

  async resolveIntentScope(
    input: ResolveIntentScopeInput,
  ): Promise<ResolvedIntentScope> {
    const intentKind = classifyIntentKind(
      input.userMessage,
      input.smallTalkHints,
    );
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

    if (!isUserIntentClear(input.userMessage)) {
      const scopedToolIds = input.tools.map((tool) => tool.id);
      const bundle = buildLangChain
        ? this.toolEngine.buildLangChainTools(input.tools, {
            ...input.toolBuildCtx,
            allowedToolIds: scopedToolIds,
          })
        : null;
      return {
        intentKind: 'unclear',
        intentClear: false,
        matchedCategoryIds: [],
        includeUncategorized: false,
        scopedTools: input.tools,
        scopedToolIds,
        scopedLangChainTools: bundle?.tools ?? [],
        scopedToolBundle: bundle,
        scopedAllowedToolIds: scopedToolIds,
      };
    }

    const categoryIds = [
      ...new Set(
        input.tools
          .map((tool) => tool.toolCategoryId)
          .filter((id): id is number => id != null),
      ),
    ];
    const categories = await this.fetchToolCategories(categoryIds);

    let recallResult;
    try {
      recallResult = await this.categoryIntentRecall.recallTopCategories(
        categories,
        input.userMessage,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`category intent recall failed: ${message}`);
      const scoped = await this.scopeToolsForMainLoop(
        input.tools,
        input.userMessage,
        input.toolBuildCtx,
        [],
        buildLangChain,
      );
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
        fallbackReason: scoped.fallbackReason ?? 'bind_recall_error',
        toolsBeforeIntentNarrow: input.tools.length,
        toolsAfterIntentNarrow: input.tools.length,
      };
    }

    const validCategoryIdSet = new Set(categories.map((category) => category.id));
    const matchedCategoryIds = recallResult.matchedCategoryIds.filter((id) =>
      validCategoryIdSet.has(id),
    );
    const parsed: ParsedIntentPayload = {
      intentClear: true,
      matchedCategoryIds,
      includeUncategorized: false,
    };
    const narrowed = this.filterToolsByIntent(input.tools, parsed);
    const scoped = await this.scopeToolsForMainLoop(
      narrowed,
      input.userMessage,
      input.toolBuildCtx,
      matchedCategoryIds,
      buildLangChain,
    );

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

  async scopeToolsForMainLoop(
    tools: IntentScopeTool[],
    userMessage: string,
    toolBuildCtx: ToolBuildContext,
    preferredCategoryIds?: number[],
    buildLangChain = true,
  ): Promise<{
    scopedTools: IntentScopeTool[];
    scopedLangChainTools: DynamicStructuredTool[];
    scopedToolBundle: BuiltLangChainTools | null;
    scopedAllowedToolIds: number[];
    bindCap?: Record<string, unknown>;
    fallbackReason?: 'bind_recall_error' | 'bind_recall_empty';
  }> {
    const fallbackBundle = () => {
      const scopedIds = tools.map((tool) => tool.id);
      if (!buildLangChain) {
        return {
          scopedTools: tools,
          scopedLangChainTools: [] as DynamicStructuredTool[],
          scopedToolBundle: null,
          scopedAllowedToolIds: scopedIds,
        };
      }
      const scopedToolBundle = this.toolEngine.buildLangChainTools(tools, {
        ...toolBuildCtx,
        allowedToolIds: scopedIds,
      });
      return {
        scopedTools: tools,
        scopedLangChainTools: scopedToolBundle.tools,
        scopedToolBundle,
        scopedAllowedToolIds: scopedIds,
      };
    };
    const metadataScoped = filterToolsByAgentMetadata(tools, userMessage);
    try {
      const bindRecall = await this.categoryIntentRecall.recallTopToolsForBind(
        metadataScoped.map((tool) => ({
          id: tool.id,
          name: tool.name,
          description: tool.description,
          toolCategoryId: tool.toolCategoryId,
          agentMetadata: tool.agentMetadata,
        })),
        userMessage,
        undefined,
        preferredCategoryIds,
      );
      const toolById = new Map(metadataScoped.map((tool) => [tool.id, tool]));
      const scopedTools = bindRecall.tools
        .map((row) => toolById.get(row.id))
        .filter((tool): tool is IntentScopeTool => tool != null);
      const effectiveTools =
        scopedTools.length > 0 ? scopedTools : metadataScoped;
      const scopedIds = effectiveTools.map((tool) => tool.id);
      const scopedToolBundle = buildLangChain
        ? this.toolEngine.buildLangChainTools(effectiveTools, {
            ...toolBuildCtx,
            allowedToolIds: scopedIds,
          })
        : null;
      const bindCap = bindRecall.capped
        ? {
            before: tools.length,
            after: effectiveTools.length,
            source: bindRecall.source,
            matches: bindRecall.matches.map((item) => ({
              id: item.id,
              name: item.name,
              score: Number(item.score.toFixed(4)),
              source: item.source,
            })),
          }
        : undefined;
      return {
        scopedTools: effectiveTools,
        scopedLangChainTools: scopedToolBundle?.tools ?? [],
        scopedToolBundle,
        scopedAllowedToolIds: scopedIds,
        bindCap,
        fallbackReason:
          scopedTools.length === 0 ? 'bind_recall_empty' : undefined,
      };
    } catch (error) {
      this.logger.warn(
        `tool bind recall failed, use full tool set: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return {
        ...fallbackBundle(),
        fallbackReason: 'bind_recall_error',
      };
    }
  }

  private buildSkippedScope(
    tools: IntentScopeTool[],
    intentKind: 'task' | 'smalltalk' | 'unclear',
    buildLangChain: boolean,
    toolBuildCtx: ToolBuildContext,
  ): ResolvedIntentScope {
    const scopedToolIds = tools.map((tool) => tool.id);
    const bundle = buildLangChain
      ? this.toolEngine.buildLangChainTools(tools, {
          ...toolBuildCtx,
          allowedToolIds: scopedToolIds,
        })
      : null;
    return {
      intentKind: 'skipped',
      intentClear: true,
      matchedCategoryIds: [],
      includeUncategorized: false,
      scopedTools: tools,
      scopedToolIds,
      scopedLangChainTools: bundle?.tools ?? [],
      scopedToolBundle: bundle,
      scopedAllowedToolIds: scopedToolIds,
    };
  }

  private filterToolsByIntent(
    tools: IntentScopeTool[],
    parsed: ParsedIntentPayload,
  ): IntentScopeTool[] {
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

  private async fetchToolCategories(toolCategoryIds: number[]) {
    const uniq = Array.from(new Set(toolCategoryIds)).sort((a, b) => a - b);
    if (uniq.length === 0) {
      return [];
    }
    const cacheKey = uniq.join(',');
    const cached = this.toolCategoryRowsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.rows;
    }
    const rows = await this.prisma.toolCategory.findMany({
      where: { id: { in: uniq } },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, label: true, description: true },
    });
    this.toolCategoryRowsCache.set(cacheKey, {
      rows,
      expiresAt: Date.now() + IntentScopeService.CATEGORY_CACHE_TTL_MS,
    });
    return rows;
  }
}
