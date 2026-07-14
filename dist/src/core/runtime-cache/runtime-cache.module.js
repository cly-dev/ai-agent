"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeCacheModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../prisma/prisma.module");
const memory_module_1 = require("../memory/memory.module");
const agent_host_tool_catalog_store_1 = require("./agent-host-tool-catalog.store");
const agent_host_tool_catalog_service_1 = require("./agent-host-tool-catalog.service");
const agent_tool_catalog_store_1 = require("./agent-tool-catalog.store");
const agent_tool_catalog_service_1 = require("./agent-tool-catalog.service");
const agent_skill_catalog_store_1 = require("./agent-skill-catalog.store");
const agent_skill_catalog_service_1 = require("./agent-skill-catalog.service");
const run_scope_cache_service_1 = require("./run-scope-cache.service");
const runtime_cache_invalidator_service_1 = require("./runtime-cache-invalidator.service");
const tool_category_cache_service_1 = require("./tool-category-cache.service");
let RuntimeCacheModule = class RuntimeCacheModule {
};
RuntimeCacheModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, memory_module_1.MemoryModule],
        providers: [
            agent_host_tool_catalog_store_1.AgentHostToolCatalogStore,
            agent_host_tool_catalog_service_1.AgentHostToolCatalogService,
            agent_tool_catalog_store_1.AgentToolCatalogStore,
            agent_tool_catalog_service_1.AgentToolCatalogService,
            agent_skill_catalog_store_1.AgentSkillCatalogStore,
            agent_skill_catalog_service_1.AgentSkillCatalogService,
            run_scope_cache_service_1.RunScopeCacheService,
            tool_category_cache_service_1.ToolCategoryCacheService,
            runtime_cache_invalidator_service_1.RuntimeCacheInvalidator,
        ],
        exports: [
            agent_host_tool_catalog_store_1.AgentHostToolCatalogStore,
            agent_host_tool_catalog_service_1.AgentHostToolCatalogService,
            agent_tool_catalog_store_1.AgentToolCatalogStore,
            agent_tool_catalog_service_1.AgentToolCatalogService,
            agent_skill_catalog_store_1.AgentSkillCatalogStore,
            agent_skill_catalog_service_1.AgentSkillCatalogService,
            run_scope_cache_service_1.RunScopeCacheService,
            tool_category_cache_service_1.ToolCategoryCacheService,
            runtime_cache_invalidator_service_1.RuntimeCacheInvalidator,
        ],
    })
], RuntimeCacheModule);
exports.RuntimeCacheModule = RuntimeCacheModule;
//# sourceMappingURL=runtime-cache.module.js.map