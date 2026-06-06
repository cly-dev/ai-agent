import { Module } from '@nestjs/common';
import { LlmModelConfigCacheStore } from './llm-model-config-cache.store';
import { LlmService } from './llm.service';

@Module({
  providers: [LlmModelConfigCacheStore, LlmService],
  exports: [LlmService, LlmModelConfigCacheStore],
})
export class LlmModule {}
