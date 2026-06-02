import { Module } from '@nestjs/common';
import { PromptModule } from '../../core/prompt/prompt.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PromptTemplateController } from './prompt-template.controller';
import { PromptTemplateService } from './prompt-template.service';

@Module({
  imports: [PrismaModule, PromptModule],
  controllers: [PromptTemplateController],
  providers: [PromptTemplateService],
  exports: [PromptTemplateService],
})
export class PromptTemplateModule {}
