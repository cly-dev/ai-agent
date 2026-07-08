import { PrismaService } from '../../prisma/prisma.service';
import { AgentHostToolCatalogStore } from './agent-host-tool-catalog.store';
import type { AgentHostToolCatalogSnapshot } from './runtime-cache.types';
import type { HostToolDecisionDefinition } from '../host-bridge';
export declare class AgentHostToolCatalogService {
    private readonly prisma;
    private readonly catalogStore;
    private readonly logger;
    constructor(prisma: PrismaService, catalogStore: AgentHostToolCatalogStore);
    loadOrWarm(appClientId: number, agentId: number): Promise<AgentHostToolCatalogSnapshot | null>;
    refresh(appClientId: number, agentId: number): Promise<AgentHostToolCatalogSnapshot | null>;
    resolveLlmHostTools(input: {
        appClientId: number;
        agentId: number;
        skillId: number | null | undefined;
        pageScope: string;
    }): Promise<{
        tools: HostToolDecisionDefinition[];
        fromCache: boolean;
    }>;
    warmPageLlmTools(input: {
        appClientId: number;
        agentId: number;
        pageScope: string;
    }): Promise<HostToolDecisionDefinition[]>;
    fetchRevisionFromDb(appClientId: number, agentId: number): Promise<string>;
    private buildFromDb;
    private loadHostToolCatalogContext;
}
