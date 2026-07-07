import type { AgentSkillWarmupRow } from '../skill/skill.types';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentSkillCatalogStore } from './agent-skill-catalog.store';
import type { AgentSkillCatalogSnapshot } from './runtime-cache.types';
export declare class AgentSkillCatalogService {
    private readonly prisma;
    private readonly catalogStore;
    private readonly logger;
    constructor(prisma: PrismaService, catalogStore: AgentSkillCatalogStore);
    listAgentSkillsForUser(input: {
        agentId: number;
        userId: number;
        appClientId: number;
    }): Promise<AgentSkillWarmupRow[]>;
    loadOrWarm(input: {
        appClientId: number;
        agentId: number;
        roleId: number;
        roleSkillFiltered: boolean;
    }): Promise<AgentSkillCatalogSnapshot | null>;
    refresh(input: {
        appClientId: number;
        agentId: number;
        roleId: number;
        roleSkillFiltered: boolean;
    }): Promise<AgentSkillCatalogSnapshot | null>;
    fetchRevisionFromDb(input: {
        appClientId: number;
        agentId: number;
        roleId: number;
        roleSkillFiltered: boolean;
    }): Promise<string>;
    private buildFromDb;
    private querySkills;
    private resolveRoleContext;
}
