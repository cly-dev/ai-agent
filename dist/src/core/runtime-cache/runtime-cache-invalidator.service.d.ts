import { PrismaService } from '../../prisma/prisma.service';
import { AgentHostToolCatalogStore } from './agent-host-tool-catalog.store';
import { AgentToolCatalogStore } from './agent-tool-catalog.store';
import { AgentSkillCatalogStore } from './agent-skill-catalog.store';
import { RunScopeCacheService } from './run-scope-cache.service';
import { ToolCategoryCacheService } from './tool-category-cache.service';
export declare class RuntimeCacheInvalidator {
    private readonly prisma;
    private readonly hostToolCatalogStore;
    private readonly agentToolCatalogStore;
    private readonly agentSkillCatalogStore;
    private readonly runScopeCache;
    private readonly toolCategoryCache;
    private readonly logger;
    constructor(prisma: PrismaService, hostToolCatalogStore: AgentHostToolCatalogStore, agentToolCatalogStore: AgentToolCatalogStore, agentSkillCatalogStore: AgentSkillCatalogStore, runScopeCache: RunScopeCacheService, toolCategoryCache: ToolCategoryCacheService);
    private sessionRuntimeHooks;
    private sessionScopeHooks;
    registerSessionRuntimeHooks(hooks: {
        invalidateSnapshotsForAgent: (agentId: number) => Promise<string[]>;
        invalidateSnapshotsContainingToolIds: (toolIds: number[]) => Promise<number>;
        deleteSession: (sessionId: string) => Promise<void>;
    }): void;
    registerSessionScopeHooks(hooks: {
        invalidateCachesForAgent: (agentId: number, sessionIds: string[]) => void;
        invalidateCachesReferencingToolIds: (toolIds: number[]) => void;
        invalidateCachesForSession: (sessionId: string) => void;
    }): void;
    invalidateForAgent(input: {
        agentId: number;
        appClientId?: number;
    }): Promise<void>;
    private deleteAgentL2Catalogs;
    invalidateForAppClient(appClientId: number): Promise<void>;
    invalidateForTools(toolIds: number[]): Promise<void>;
    invalidateForHostTools(hostToolIds: number[]): Promise<void>;
    invalidateForSkillAgent(agentId: number, appClientId: number): Promise<void>;
    invalidateForIntegration(integrationId: number): Promise<void>;
    invalidateForSession(sessionId: string): void;
    clearRunScope(runId: number): void;
    invalidateToolCategories(): void;
}
