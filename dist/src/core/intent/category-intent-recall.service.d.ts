import { LlmService } from '../llm/llm.service';
import { IntentRecallConfigService } from './intent-recall-config.service';
import type { CategoryRecallResult, ToolBindRecallResult, ToolBindRecallRow, ToolCategoryRecallRow } from './intent.types';
export declare class CategoryIntentRecallService {
    private readonly llmService;
    private readonly intentRecallConfig;
    private readonly logger;
    private readonly categoryVectorCache;
    private readonly toolVectorCache;
    private static readonly TOOL_CATEGORY_BOOST;
    constructor(llmService: LlmService, intentRecallConfig: IntentRecallConfigService);
    recallTopCategories(categories: ToolCategoryRecallRow[], userMessage: string, topK?: number): Promise<CategoryRecallResult>;
    private logCategoryRecallResult;
    recallTopToolsForBind(tools: ToolBindRecallRow[], userMessage: string, topK?: number, preferredCategoryIds?: number[]): Promise<ToolBindRecallResult>;
    private isNoRelevantBindMatch;
    private toToolBindResult;
    private sliceToolsByOrder;
    private keywordRecall;
    private toRecallResult;
    private ensureCategoryVectors;
    private toolEmbedText;
    private ensureToolVectors;
}
