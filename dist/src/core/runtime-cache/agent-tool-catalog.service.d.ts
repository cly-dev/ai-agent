import { PrismaService } from '../../prisma/prisma.service';
import { AgentToolCatalogStore } from './agent-tool-catalog.store';
import type { AgentToolCatalogRow } from './agent-tool-catalog.types';
import type { AgentToolCatalogSnapshot } from './runtime-cache.types';
export declare class AgentToolCatalogService {
    private readonly prisma;
    private readonly catalogStore;
    private readonly logger;
    constructor(prisma: PrismaService, catalogStore: AgentToolCatalogStore);
    resolveAllowedTools(agentId: number, userId: number, appClientId: number): Promise<AgentToolCatalogRow[]>;
    loadOrWarm(appClientId: number, agentId: number): Promise<AgentToolCatalogSnapshot | null>;
    refresh(appClientId: number, agentId: number): Promise<AgentToolCatalogSnapshot | null>;
    fetchRevisionFromDb(appClientId: number, agentId: number): Promise<string>;
    private buildFromDb;
    private loadToolCatalogContext;
    private resolveUserRoleToolContext;
}
