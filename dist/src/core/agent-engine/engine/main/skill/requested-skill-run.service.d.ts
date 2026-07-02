import { SkillService } from '../../../../skill/skill.service';
import { ToolEngineService } from '../../../../tool-engine/tool-engine.service';
import type { ToolBuildContext } from '../../../../tool-engine/tool-engine.service';
import type { AgentSkillWarmupRow } from '../../../../skill/skill.types';
import type { AgentEngineTool } from '../types/agent-engine.types';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { type RequestedSkillRunErrorCode } from './requested-skill-run.error';
export type SkillScopedTools = {
    scopedTools: AgentEngineTool[];
    scopedLangChainTools: ReturnType<ToolEngineService['buildLangChainTools']>['tools'];
    scopedToolBundle: ReturnType<ToolEngineService['buildLangChainTools']>;
    scopedAllowedToolIds: number[];
    skillToolIds: number[];
};
export type RequestedSkillRunContext = {
    skillId: number;
    skill: AgentSkillWarmupRow;
    scoped: SkillScopedTools;
};
export declare class RequestedSkillRunService {
    private readonly skillService;
    private readonly toolEngine;
    private readonly prisma;
    constructor(skillService: SkillService, toolEngine: ToolEngineService, prisma: PrismaService);
    assertRunnableForMessage(input: {
        userId: number;
        appClientId: number;
        agentId: number;
        skillId: number;
        allowedTools: AgentEngineTool[];
    }): Promise<void>;
    loadRunContext(input: {
        userId: number;
        appClientId: number;
        agentId: number;
        skillId: number;
        allowedTools: AgentEngineTool[];
        toolBuildCtx: ToolBuildContext;
        runId?: number;
        sessionId?: string;
    }): Promise<RequestedSkillRunContext>;
    buildSkillScopedTools(input: {
        skillTools: AgentEngineTool[];
        toolBuildCtx: ToolBuildContext;
    }): SkillScopedTools;
    private resolveRunnable;
    private resolveVisibleSkill;
    private pickSkillToolsFromAllowed;
    private pickWorkflowSkillTools;
    private loadWorkflowRunnableContext;
    private rethrowAsBadRequest;
}
export declare function requestedSkillUserMessage(code: RequestedSkillRunErrorCode): string;
