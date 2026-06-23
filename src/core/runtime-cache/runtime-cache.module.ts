import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MemoryModule } from '../memory/memory.module';
import { AgentHostToolCatalogStore } from './agent-host-tool-catalog.store';
import { AgentHostToolCatalogService } from './agent-host-tool-catalog.service';
import { AgentToolCatalogStore } from './agent-tool-catalog.store';
import { AgentToolCatalogService } from './agent-tool-catalog.service';
import { AgentSkillCatalogStore } from './agent-skill-catalog.store';
import { AgentSkillCatalogService } from './agent-skill-catalog.service';
import { RunScopeCacheService } from './run-scope-cache.service';
import { RuntimeCacheInvalidator } from './runtime-cache-invalidator.service';
import { ToolCategoryCacheService } from './tool-category-cache.service';

@Global()
@Module({
  imports: [PrismaModule, MemoryModule],
  providers: [
    AgentHostToolCatalogStore,
    AgentHostToolCatalogService,
    AgentToolCatalogStore,
    AgentToolCatalogService,
    AgentSkillCatalogStore,
    AgentSkillCatalogService,
    RunScopeCacheService,
    ToolCategoryCacheService,
    RuntimeCacheInvalidator,
  ],
  exports: [
    AgentHostToolCatalogStore,
    AgentHostToolCatalogService,
    AgentToolCatalogStore,
    AgentToolCatalogService,
    AgentSkillCatalogStore,
    AgentSkillCatalogService,
    RunScopeCacheService,
    ToolCategoryCacheService,
    RuntimeCacheInvalidator,
  ],
})
export class RuntimeCacheModule {}
