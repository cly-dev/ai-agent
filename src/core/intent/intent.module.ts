import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ToolEngineModule } from '../tool-engine/tool-engine.module';
import { CategoryIntentRecallService } from './category-intent-recall.service';
import { IntentRecallConfigService } from './intent-recall-config.service';
import { IntentScopeService } from './intent-scope.service';

/**
 * 意图召回 Nest 模块。
 * 依赖 LlmModule 提供的 embedding API，供 AgentEngineModule 注入使用。
 */
@Module({
  imports: [LlmModule, PrismaModule, ToolEngineModule],
  providers: [
    IntentRecallConfigService,
    CategoryIntentRecallService,
    IntentScopeService,
  ],
  exports: [
    CategoryIntentRecallService,
    IntentRecallConfigService,
    IntentScopeService,
  ],
})
export class IntentModule {}
