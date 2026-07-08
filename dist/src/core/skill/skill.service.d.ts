import { AgentSkillCatalogService } from '../runtime-cache/agent-skill-catalog.service';
import { ToolEngineService } from '../tool-engine/tool-engine.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AgentEngineTool } from '../agent-engine/engine/main/types/agent-engine.types';
import type { AgentSkillWarmupRow, AvailableSkillRow, GetRunnableSkillDetailInput, ListAgentSkillsInput, ListAvailableSkillsInput, ResolveSkillsForOuterPlanInput, SkillBindResult } from './skill.types';
import type { ToolBuildContext } from '../tool-engine/tool-engine.service';
import type { TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
type SkillDbRow = {
    id: number;
    name: string;
    description: string | null;
    prompt: string;
    config: unknown;
    riskLevel: AvailableSkillRow['riskLevel'];
    capabilityKey: string | null;
    workflowId: number | null;
    workflowVersion: number | null;
    workflowOverrides: unknown;
    skillTools: Array<{
        toolId: number;
    }>;
    skillHostTools: Array<{
        hostToolId: number;
    }>;
};
export declare class SkillService {
    private readonly prisma;
    private readonly toolEngine;
    private readonly agentSkillCatalogService;
    constructor(prisma: PrismaService, toolEngine: ToolEngineService, agentSkillCatalogService: AgentSkillCatalogService);
    getRunnableSkillDetailById(input: GetRunnableSkillDetailInput): Promise<AvailableSkillRow | null>;
    getAvailableSkillById(input: {
        agentId: number;
        userId: number;
        appClientId: number;
        skillId: number;
        scopedTools: AgentEngineTool[];
    }): Promise<AvailableSkillRow | null>;
    resolveSkillsForOuterPlan(input: ResolveSkillsForOuterPlanInput): Promise<AvailableSkillRow[]>;
    listResolvableSkillsForScopedTools(input: ListAvailableSkillsInput): Promise<AvailableSkillRow[]>;
    listAvailableSkillsForScopedTools(input: ListAvailableSkillsInput): Promise<AvailableSkillRow[]>;
    listAgentSkillsForUser(input: ListAgentSkillsInput): Promise<AgentSkillWarmupRow[]>;
    listRunnableAgentSkillsForUser(input: ListAgentSkillsInput, allowedToolIds: ReadonlySet<number>): Promise<AgentSkillWarmupRow[]>;
    bindSkillToScopedTools(skill: {
        skillToolIds: number[];
    } | Pick<SkillDbRow, 'skillTools'>, scopedTools: AgentEngineTool[], toolBuildCtx: ToolBuildContext): SkillBindResult;
    tryBuildTaskPlanFromSkillWorkflow(input: {
        appClientId: number;
        userMessage: string;
        skill: Pick<AvailableSkillRow, 'workflowId' | 'workflowVersion' | 'workflowOverrides'>;
        goal?: string;
    }): Promise<TaskPlanSnapshot | null>;
    private queryHostBoundSkills;
    private narrowHostToolIdsToPageScope;
    private queryPureHostSkills;
    private toScopedHostToolIdSet;
    private mergeSkillDbRows;
    private toAvailableSkillRowIfResolvable;
    private loadAgentRunnableHostToolIds;
    private resolveRunnableHostToolIds;
    private resolveRoleContext;
    private queryAgentSkills;
    private toActiveSkillSnapshot;
    private toAvailableSkillRow;
}
export {};
