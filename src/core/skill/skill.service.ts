import { Injectable } from '@nestjs/common';
import { ToolEngineService } from '../tool-engine/tool-engine.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AgentEngineTool } from '../agent-engine/engine/main/agent-engine.types';
import type {
  ActiveSkillSnapshot,
  AgentSkillWarmupRow,
  AvailableSkillRow,
  ListAgentSkillsInput,
  ListAvailableSkillsInput,
  SkillBindResult,
} from './skill.types';
import type { ToolBuildContext } from '../tool-engine/tool-engine.service';

type SkillDbRow = {
  id: number;
  name: string;
  description: string | null;
  prompt: string;
  config: unknown;
  riskLevel: AvailableSkillRow['riskLevel'];
  capabilityKey: string | null;
  skillTools: Array<{ toolId: number }>;
};

@Injectable()
export class SkillService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly toolEngine: ToolEngineService,
  ) {}

  /** intent 收窄后的 scopedTools 上推导可用 Skill（SkillTool 交集 + RoleSkill）。 */
  async getAvailableSkillById(input: {
    agentId: number;
    userId: number;
    appClientId: number;
    skillId: number;
    scopedTools: AgentEngineTool[];
  }): Promise<AvailableSkillRow | null> {
    const available = await this.listAvailableSkillsForScopedTools({
      agentId: input.agentId,
      userId: input.userId,
      appClientId: input.appClientId,
      scopedTools: input.scopedTools,
    });
    return available.find((skill) => skill.id === input.skillId) ?? null;
  }

  async listAvailableSkillsForScopedTools(
    input: ListAvailableSkillsInput,
  ): Promise<AvailableSkillRow[]> {
    if (input.scopedTools.length === 0) {
      return [];
    }
    const roleContext = await this.resolveRoleContext(
      input.userId,
      input.appClientId,
    );
    if (!roleContext) {
      return [];
    }
    const scopedToolIds = input.scopedTools.map((tool) => tool.id);
    const rows = await this.queryAgentSkills({
      agentId: input.agentId,
      roleId: roleContext.roleId,
      roleSkillFiltered: roleContext.roleSkillFiltered,
      toolIdFilter: scopedToolIds,
    });
    return rows.map((row) => this.toAvailableSkillRow(row));
  }

  /** 预热：加载 Agent 下用户角色可见的全部 active Skill（不按工具过滤）。 */
  async listAgentSkillsForUser(
    input: ListAgentSkillsInput,
  ): Promise<AgentSkillWarmupRow[]> {
    const roleContext = await this.resolveRoleContext(
      input.userId,
      input.appClientId,
    );
    if (!roleContext) {
      return [];
    }
    const rows = await this.queryAgentSkills({
      agentId: input.agentId,
      roleId: roleContext.roleId,
      roleSkillFiltered: roleContext.roleSkillFiltered,
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      capabilityKey: row.capabilityKey,
      riskLevel: row.riskLevel,
      toolIds: row.skillTools.map((skillTool) => skillTool.toolId),
    }));
  }

  bindSkillToScopedTools(
    skill: { skillToolIds: number[] } | Pick<SkillDbRow, 'skillTools'>,
    scopedTools: AgentEngineTool[],
    toolBuildCtx: ToolBuildContext,
  ): SkillBindResult {
    const skillToolIds = new Set(
      'skillToolIds' in skill
        ? skill.skillToolIds
        : skill.skillTools.map((row) => row.toolId),
    );
    const narrowed = scopedTools.filter((tool) => skillToolIds.has(tool.id));
    const scopedAllowedToolIds = narrowed.map((tool) => tool.id);
    const scopedToolBundle = this.toolEngine.buildLangChainTools(narrowed, {
      ...toolBuildCtx,
      allowedToolIds: scopedAllowedToolIds,
    });
    return {
      scopedTools: narrowed as AgentEngineTool[],
      scopedAllowedToolIds,
      scopedToolBundle,
    };
  }

  private async resolveRoleContext(
    userId: number,
    appClientId: number,
  ): Promise<{ roleId: number; roleSkillFiltered: boolean } | null> {
    const userApp = await this.prisma.userApp.findFirst({
      where: { userId, appId: appClientId },
      select: { roleId: true },
    });
    if (!userApp) {
      return null;
    }
    const roleSkillCount = await this.prisma.roleSkill.count({
      where: { roleId: userApp.roleId },
    });
    return {
      roleId: userApp.roleId,
      roleSkillFiltered: roleSkillCount > 0,
    };
  }

  private async queryAgentSkills(input: {
    agentId: number;
    roleId: number;
    roleSkillFiltered: boolean;
    toolIdFilter?: number[];
  }): Promise<SkillDbRow[]> {
    return this.prisma.skill.findMany({
      where: {
        agentId: input.agentId,
        isActive: true,
        ...(input.toolIdFilter && input.toolIdFilter.length > 0
          ? {
              skillTools: {
                some: { toolId: { in: input.toolIdFilter } },
              },
            }
          : {}),
        ...(input.roleSkillFiltered
          ? { roleSkills: { some: { roleId: input.roleId } } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        prompt: true,
        config: true,
        riskLevel: true,
        capabilityKey: true,
        skillTools: { select: { toolId: true } },
      },
    });
  }

  private toActiveSkillSnapshot(row: SkillDbRow): ActiveSkillSnapshot {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      prompt: row.prompt,
      config: row.config,
      riskLevel: row.riskLevel,
      capabilityKey: row.capabilityKey,
    };
  }

  private toAvailableSkillRow(row: SkillDbRow): AvailableSkillRow {
    return {
      ...this.toActiveSkillSnapshot(row),
      skillToolIds: row.skillTools.map((skillTool) => skillTool.toolId),
    };
  }
}
