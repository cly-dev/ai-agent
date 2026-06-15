import { Module } from '@nestjs/common';
import { ToolEngineModule } from '../tool-engine/tool-engine.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { SkillService } from './skill.service';

@Module({
  imports: [PrismaModule, ToolEngineModule],
  providers: [SkillService],
  exports: [SkillService],
})
export class SkillModule {}
