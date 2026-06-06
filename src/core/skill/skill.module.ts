import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { IntentModule } from '../intent/intent.module';
import { LlmModule } from '../llm/llm.module';
import { ToolEngineModule } from '../tool-engine/tool-engine.module';
import { SkillRecallService } from './skill-recall.service';
import { SkillService } from './skill.service';

@Module({
  imports: [PrismaModule, ToolEngineModule, LlmModule, IntentModule],
  providers: [SkillRecallService, SkillService],
  exports: [SkillService],
})
export class SkillModule {}
