import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { CategoryIntentRecallService } from './category-intent-recall.service';
import { IntentRecallConfigService } from './intent-recall-config.service';

/**
 * 意图召回 Nest 模块。
 * 依赖 LlmModule 提供的 embedding API，供 AgentEngineModule 注入使用。
 */
@Module({
  imports: [LlmModule, PrismaModule],
  providers: [IntentRecallConfigService, CategoryIntentRecallService],
  exports: [CategoryIntentRecallService, IntentRecallConfigService],
})
export class IntentModule {}
