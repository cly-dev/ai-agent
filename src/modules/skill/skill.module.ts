import { Module, forwardRef } from '@nestjs/common';
import { SkillModule as SkillRuntimeModule } from '../../core/skill/skill.module';
import { RuntimeCacheModule } from '../../core/runtime-cache/runtime-cache.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { AgentModule } from '../agent/agent.module';
import { SkillService } from './skill.service';
import { SkillController } from './skill.controller';

@Module({
  imports: [
    PrismaModule,
    SkillRuntimeModule,
    RuntimeCacheModule,
    forwardRef(() => AgentModule),
  ],
  providers: [SkillService],
  controllers: [SkillController],
  exports: [SkillService],
})
export class SkillModule {}
