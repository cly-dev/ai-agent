import { Module } from '@nestjs/common';
import { LlmModelConfigCacheStore } from './llm-model-config-cache.store';
import { LlmService } from './llm.service';
import { PromptBudgetService } from './prompt-budget/prompt-budget.service';

@Module({
  providers: [LlmModelConfigCacheStore, PromptBudgetService, LlmService],
  exports: [LlmService, LlmModelConfigCacheStore, PromptBudgetService],
})
export class LlmModule {}
