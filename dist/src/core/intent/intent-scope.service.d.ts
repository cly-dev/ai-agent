import type { DynamicStructuredTool } from '@langchain/core/tools';
import { PrismaService } from '../../prisma/prisma.service';
import { ToolEngineService } from '../tool-engine/tool-engine.service';
import type { BuiltLangChainTools, ToolBuildContext } from '../tool-engine/tool-engine.types';
import { CategoryIntentRecallService } from './category-intent-recall.service';
import { IntentRecallConfigService } from './intent-recall-config.service';
import { ToolCategoryCacheService } from '../runtime-cache/tool-category-cache.service';
import type { IntentScopeTool, ResolveIntentScopeInput, ResolvedIntentScope } from './intent-scope.types';
export declare class IntentScopeService {
    private readonly prisma;
    private readonly categoryIntentRecall;
    private readonly intentRecallConfig;
    private readonly toolEngine;
    private readonly toolCategoryCache;
    private readonly logger;
    constructor(prisma: PrismaService, categoryIntentRecall: CategoryIntentRecallService, intentRecallConfig: IntentRecallConfigService, toolEngine: ToolEngineService, toolCategoryCache: ToolCategoryCacheService);
    buildIntentClarificationGuidance(userMessage: string): string;
    resolveIntentScope(input: ResolveIntentScopeInput): Promise<ResolvedIntentScope>;
    scopeToolsForMainLoop(tools: IntentScopeTool[], userMessage: string, toolBuildCtx: ToolBuildContext, preferredCategoryIds?: number[], buildLangChain?: boolean): Promise<{
        scopedTools: IntentScopeTool[];
        scopedLangChainTools: DynamicStructuredTool[];
        scopedToolBundle: BuiltLangChainTools | null;
        scopedAllowedToolIds: number[];
        bindCap?: Record<string, unknown>;
        fallbackReason?: 'bind_recall_error' | 'bind_recall_empty';
    }>;
    private buildSkippedScope;
    private filterToolsByIntent;
    private fetchToolCategories;
}
