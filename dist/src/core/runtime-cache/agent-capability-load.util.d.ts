import type { PrismaService } from '../../prisma/prisma.service';
export declare function loadAgentToolCandidateIds(prisma: PrismaService, appClientId: number, agentId: number): Promise<number[]>;
export declare function loadAgentHostToolCandidateIds(prisma: PrismaService, appClientId: number, agentId: number): Promise<number[]>;
export declare function loadAgentSkillVisibilityContext(prisma: PrismaService, appClientId: number, agentId: number): Promise<{
    restrictSkills: boolean;
    skillWhitelistIds: number[];
}>;
