import { Module } from '@nestjs/common';
import { LLM_ADAPTER } from './adapters/llm-adapter.interface';
import { OpenAiCompatibleAdapter } from './adapters/openai-compatible.adapter';
import { LlmService } from './llm.service';

@Module({
  providers: [
    LlmService,
    OpenAiCompatibleAdapter,
    {
      provide: LLM_ADAPTER,
      useExisting: OpenAiCompatibleAdapter,
    },
  ],
  exports: [LlmService],
})
export class LlmModule {}
