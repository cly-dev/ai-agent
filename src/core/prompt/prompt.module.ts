import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PromptComposerService } from './prompt-composer.service';
import { PromptRegistryService } from './prompt-registry.service';
import { PromptTemplateStore } from './prompt-template.store';

@Module({
  imports: [PrismaModule],
  providers: [PromptTemplateStore, PromptRegistryService, PromptComposerService],
  exports: [PromptTemplateStore, PromptRegistryService, PromptComposerService],
})
export class PromptModule {}
