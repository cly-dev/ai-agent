import { Module } from '@nestjs/common';
import { IntentModule } from '../../core/intent/intent.module';
import { LlmModule } from '../../core/llm/llm.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { LlmModelConfigController } from './llm-model-config.controller';
import { LlmModelConfigService } from './llm-model-config.service';

@Module({
  imports: [PrismaModule, LlmModule, IntentModule],
  providers: [LlmModelConfigService],
  controllers: [LlmModelConfigController],
  exports: [LlmModelConfigService],
})
export class LlmModelConfigModule {}
