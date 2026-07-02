import { BadRequestException, Injectable } from '@nestjs/common';
import { SkillService } from '../../../../skill/skill.service';
import { ToolEngineService } from '../../../../tool-engine/tool-engine.service';
import type { ToolBuildContext } from '../../../../tool-engine/tool-engine.service';
import type { AgentSkillWarmupRow } from '../../../../skill/skill.types';
import type { AgentEngineTool } from '../types/agent-engine.types';
import { logHostToolResolve } from '../../../../host-bridge/host-tool-resolve-debug.util';
import {
  deriveSkillRunnableKind,
  normalizeSkillRunnableCapabilities,
  skillIsRunnableForUser,
  skillIsWorkflowBound,
} from '../../../../skill/skill-runnable.util';
import { loadAgentHostToolCandidateIds } from '../../../../runtime-cache/agent-capability-load.util';
import {
  loadWorkflowForRunDetailed,
  parseWorkflowOverridesJson,
} from '../../../../workflow/load-workflow-definition.util';
import {
  collectWorkflowScopedToolIds,
  workflowNodeRefsRunnableForUser,
} from '../../../../workflow/workflow-runtime-scope.util';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  RequestedSkillRunError,
  type RequestedSkillRunErrorCode,
} from './requested-skill-run.error';

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

@Injectable()
export class RequestedSkillRunService {
  constructor(
    private readonly skillService: SkillService,
    private readonly toolEngine: ToolEngineService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * C 端发消息前：角色可见 + Skill 有可运行 HTTP Tool 或 Agent 白名单内 SkillHostTool。
   */
  async assertRunnableForMessage(input: {
    userId: number;
    appClientId: number;
    agentId: number;
    skillId: number;
    allowedTools: AgentEngineTool[];
  }): Promise<void> {
    try {
      await this.resolveRunnable(input);
    } catch (error) {
      this.rethrowAsBadRequest(error);
    }
  }

  /**
   * Run 启动：在接口层已校验的前提下，绑定 Skill 专属 scopedTools（跳过 intent 收窄）。
   */
  async loadRunContext(input: {
    userId: number;
    appClientId: number;
    agentId: number;
    skillId: number;
    allowedTools: AgentEngineTool[];
    toolBuildCtx: ToolBuildContext;
    runId?: number;
    sessionId?: string;
  }): Promise<RequestedSkillRunContext> {
    const { skill, skillTools } = await this.resolveRunnable({
      ...input,
      runId: input.runId,
      sessionId: input.sessionId,
    });
    const capabilities = normalizeSkillRunnableCapabilities(skill);
    logHostToolResolve('requestedSkillLoadRunContext', {
      runId: input.runId ?? null,
      sessionId: input.sessionId ?? null,
      agentId: input.agentId,
      appClientId: input.appClientId,
      userId: input.userId,
      skillId: skill.id,
      skillName: skill.name,
      runnableKind: deriveSkillRunnableKind(capabilities),
      skillToolIds: capabilities.skillToolIds,
      hostToolIds: capabilities.hostToolIds,
      pickedHttpToolIds: skillTools.map((tool) => tool.id),
      pickedHttpToolNames: skillTools.map((tool) => tool.name),
      allowedToolCount: input.allowedTools.length,
    });
    return {
      skillId: skill.id,
      skill,
      scoped: this.buildSkillScopedTools({
        skillTools,
        toolBuildCtx: input.toolBuildCtx,
      }),
    };
  }

  /** 仅使用 Skill 绑定且用户有权限的 Tool，不做 intent / bind 收窄。 */
  buildSkillScopedTools(input: {
    skillTools: AgentEngineTool[];
    toolBuildCtx: ToolBuildContext;
  }): SkillScopedTools {
    const scopedTools = input.skillTools;
    const scopedAllowedToolIds = scopedTools.map((tool) => tool.id);
    const scopedToolBundle = this.toolEngine.buildLangChainTools(scopedTools, {
      ...input.toolBuildCtx,
      allowedToolIds: scopedAllowedToolIds,
    });
    return {
      scopedTools,
      scopedLangChainTools: scopedToolBundle.tools,
      scopedToolBundle,
      scopedAllowedToolIds,
      skillToolIds: scopedAllowedToolIds,
    };
  }

  private async resolveRunnable(input: {
    userId: number;
    appClientId: number;
    agentId: number;
    skillId: number;
    allowedTools: AgentEngineTool[];
    runId?: number;
    sessionId?: string;
  }): Promise<{ skill: AgentSkillWarmupRow; skillTools: AgentEngineTool[] }> {
    const skill = await this.resolveVisibleSkill(input);
    const allowedToolIds = new Set(input.allowedTools.map((tool) => tool.id));
    const capabilities = normalizeSkillRunnableCapabilities(skill);

    if (skillIsWorkflowBound(skill)) {
      const workflowCheck = await this.loadWorkflowRunnableContext({
        skill,
        allowedToolIds,
        appClientId: input.appClientId,
        agentId: input.agentId,
      });
      logHostToolResolve('requestedSkillResolveRunnable', {
        runId: input.runId ?? null,
        sessionId: input.sessionId ?? null,
        agentId: input.agentId,
        skillId: input.skillId,
        skillName: skill.name,
        skillToolIds: capabilities.skillToolIds,
        hostToolIds: capabilities.hostToolIds,
        runnableKind: deriveSkillRunnableKind(capabilities),
        runnable: workflowCheck.runnable,
        workflowId: skill.workflowId ?? null,
        allowedToolIds: [...allowedToolIds],
      });
      if (!workflowCheck.runnable) {
        throw new RequestedSkillRunError(
          'SKILL_TOOLS_EMPTY',
          `skill ${input.skillId} workflow is not runnable for the current user or agent binding`,
        );
      }
      const skillTools = this.pickWorkflowSkillTools(
        workflowCheck.workflowScopedToolIds,
        skill,
        input.allowedTools,
      );
      return { skill, skillTools };
    }

    const runnable = skillIsRunnableForUser(skill, allowedToolIds);
    logHostToolResolve('requestedSkillResolveRunnable', {
      runId: input.runId ?? null,
      sessionId: input.sessionId ?? null,
      agentId: input.agentId,
      skillId: input.skillId,
      skillName: skill.name,
      skillToolIds: capabilities.skillToolIds,
      hostToolIds: capabilities.hostToolIds,
      runnableKind: deriveSkillRunnableKind(capabilities),
      runnable,
      allowedToolIds: [...allowedToolIds],
    });
    if (!runnable) {
      throw new RequestedSkillRunError(
        'SKILL_TOOLS_EMPTY',
        `skill ${input.skillId} has no usable tools or host tools for the current user or agent binding`,
      );
    }
    const skillTools = this.pickSkillToolsFromAllowed(skill, input.allowedTools);
    return { skill, skillTools };
  }

  private async resolveVisibleSkill(input: {
    userId: number;
    appClientId: number;
    agentId: number;
    skillId: number;
  }): Promise<AgentSkillWarmupRow> {
    const rows = await this.skillService.listAgentSkillsForUser({
      agentId: input.agentId,
      userId: input.userId,
      appClientId: input.appClientId,
    });
    const skill = rows.find((row) => row.id === input.skillId);
    if (!skill) {
      throw new RequestedSkillRunError(
        'SKILL_NOT_VISIBLE',
        `skill ${input.skillId} is not available for this agent or user role`,
      );
    }
    return skill;
  }

  private pickSkillToolsFromAllowed(
    skill: AgentSkillWarmupRow,
    allowedTools: AgentEngineTool[],
  ): AgentEngineTool[] {
    const skillToolIdSet = new Set(skill.toolIds);
    return allowedTools.filter((tool) => skillToolIdSet.has(tool.id));
  }

  private pickWorkflowSkillTools(
    workflowScopedToolIds: number[],
    skill: AgentSkillWarmupRow,
    allowedTools: AgentEngineTool[],
  ): AgentEngineTool[] {
    if (workflowScopedToolIds.length > 0) {
      const scoped = new Set(workflowScopedToolIds);
      return allowedTools.filter((tool) => scoped.has(tool.id));
    }
    return this.pickSkillToolsFromAllowed(skill, allowedTools);
  }

  private async loadWorkflowRunnableContext(input: {
    skill: AgentSkillWarmupRow;
    allowedToolIds: ReadonlySet<number>;
    appClientId: number;
    agentId: number;
  }): Promise<{
    runnable: boolean;
    workflowScopedToolIds: number[];
  }> {
    const workflowId = input.skill.workflowId;
    if (workflowId == null || workflowId <= 0) {
      return { runnable: false, workflowScopedToolIds: [] };
    }
    const allowedHostToolIds = new Set(
      await loadAgentHostToolCandidateIds(
        this.prisma,
        input.appClientId,
        input.agentId,
      ),
    );
    const loadResult = await loadWorkflowForRunDetailed(this.prisma, {
      workflowId,
      appClientId: input.appClientId,
      workflowVersion: input.skill.workflowVersion ?? null,
      workflowOverrides: parseWorkflowOverridesJson(
        input.skill.workflowOverrides,
      ),
      scope: {
        allowedToolIds: [...input.allowedToolIds],
        allowedHostToolIds: [...allowedHostToolIds],
      },
    });
    if (loadResult.status !== 'loaded') {
      return { runnable: false, workflowScopedToolIds: [] };
    }
    const workflowScopedToolIds = collectWorkflowScopedToolIds(
      loadResult.nodes,
      input.allowedToolIds,
    );
    return {
      runnable: workflowNodeRefsRunnableForUser({
        nodes: loadResult.nodes,
        userAllowedToolIds: input.allowedToolIds,
        userAllowedHostToolIds: allowedHostToolIds,
      }),
      workflowScopedToolIds,
    };
  }

  private rethrowAsBadRequest(error: unknown): never {
    if (error instanceof RequestedSkillRunError) {
      throw new BadRequestException({
        message: requestedSkillUserMessage(error.code),
        code: error.code,
      });
    }
    throw error;
  }
}

export function requestedSkillUserMessage(code: RequestedSkillRunErrorCode): string {
  switch (code) {
    case 'SKILL_NOT_VISIBLE':
      return '所选技能不可用，请刷新技能列表后重试。';
    case 'SKILL_TOOLS_EMPTY':
      return '所选技能暂无可用工具，请联系管理员检查技能与权限配置。';
    case 'SKILL_NOT_IN_SCOPE':
      return '所选技能与当前会话工具范围不匹配，请重选技能或调整说法后重试。';
    case 'SKILL_EXPAND_FAILED':
      return '无法进入所选技能，请重选技能后重试。';
    default:
      return '所选技能无法使用，请重试。';
  }
}
