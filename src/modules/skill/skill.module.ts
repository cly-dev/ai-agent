import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SkillService } from './skill.service';
import { SkillController } from './skill.controller';

@Module({
  imports: [PrismaModule],
  providers: [SkillService],
  controllers: [SkillController],
  exports: [SkillService],
})
export class SkillModule {}
