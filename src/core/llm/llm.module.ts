import { Module } from '@nestjs/common';
import { OutboundHttpModule } from '../outbound-http/outbound-http.module';
import { LlmModelConfigCacheStore } from './llm-model-config-cache.store';
import { LlmService } from './llm.service';
import { PromptBudgetService } from './prompt-budget/prompt-budget.service';

@Module({
  imports: [OutboundHttpModule],
  providers: [LlmModelConfigCacheStore, PromptBudgetService, LlmService],
  exports: [LlmService, LlmModelConfigCacheStore, PromptBudgetService],
})
export class LlmModule {}
