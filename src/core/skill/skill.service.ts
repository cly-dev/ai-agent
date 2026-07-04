import { Injectable } from '@nestjs/common';
import { AgentSkillCatalogService } from '../runtime-cache/agent-skill-catalog.service';
import { ToolEngineService } from '../tool-engine/tool-engine.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AgentEngineTool } from '../agent-engine/engine/main/types/agent-engine.types';
import type {
  ActiveSkillSnapshot,
  AgentSkillWarmupRow,
  AvailableSkillRow,
  GetRunnableSkillDetailInput,
  ListAgentSkillsInput,
  ListAvailableSkillsInput,
  ResolveSkillsForOuterPlanInput,
  SkillBindResult,
} from './skill.types';
import type { ToolBuildContext } from '../tool-engine/tool-engine.service';
import {
  deriveSkillRunnableKind,
  skillIsResolvableForRequested,
  skillIsResolvableInScope,
  skillIsRunnableForUser,
  skillIsWorkflowBound,
} from './skill-runnable.util';
import { buildAgentSkillVisibilityWhere } from '../runtime-cache/capability-candidate.util';
import { loadAgentSkillVisibilityContext, loadAgentHostToolCandidateIds } from '../runtime-cache/agent-capability-load.util';
import { tryBuildTaskPlanFromSkillWorkflow } from '../workflow/resolve-skill-workflow-plan.util';
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
  skillTools: Array<{ toolId: number }>;
  skillHostTools: Array<{ hostToolId: number }>;
};

@Injectable()
export class SkillService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly toolEngine: ToolEngineService,
    private readonly agentSkillCatalogService: AgentSkillCatalogService,
  ) {}

  /** 在当前 scopedTools 上下文内解析单个 Skill。 */
  async getRunnableSkillDetailById(
    input: GetRunnableSkillDetailInput,
  ): Promise<AvailableSkillRow | null> {
    const roleContext = await this.resolveRoleContext(
      input.userId,
      input.appClientId,
    );
    if (!roleContext) {
      return null;
    }
    const [rows, runnableHostToolIds] = await Promise.all([
      this.queryAgentSkills({
        appClientId: input.appClientId,
        agentId: input.agentId,
        roleId: roleContext.roleId,
        roleSkillFiltered: roleContext.roleSkillFiltered,
        skillId: input.skillId,
      }),
      this.loadAgentRunnableHostToolIds(input.appClientId, input.agentId),
    ]);
    const row = rows[0];
    if (!row) {
      return null;
    }
    const scopedHostToolIdSet = this.toScopedHostToolIdSet(
      input.scopedHostToolIds,
      runnableHostToolIds,
    );
    return this.toAvailableSkillRowIfResolvable(
      row,
      runnableHostToolIds,
      new Set(input.scopedTools.map((tool) => tool.id)),
      scopedHostToolIdSet,
      input.forRequestedSkill === true,
    );
  }

  /** @deprecated 使用 getRunnableSkillDetailById */
  async getAvailableSkillById(input: {
    agentId: number;
    userId: number;
    appClientId: number;
    skillId: number;
    scopedTools: AgentEngineTool[];
  }): Promise<AvailableSkillRow | null> {
    return this.getRunnableSkillDetailById(input);
  }

  /**
   * 外层 Plan：在 scopedTools 上列出可解析 Skill；requestedSkillId 不在列表时用显式解析兜底。
   */
  async resolveSkillsForOuterPlan(
    input: ResolveSkillsForOuterPlanInput,
  ): Promise<AvailableSkillRow[]> {
    const skills = await this.listResolvableSkillsForScopedTools(input);
    const requestedSkillId = input.requestedSkillId;
    if (
      requestedSkillId == null ||
      skills.some((skill) => skill.id === requestedSkillId)
    ) {
      return skills;
    }
    const requested = await this.getRunnableSkillDetailById({
      agentId: input.agentId,
      userId: input.userId,
      appClientId: input.appClientId,
      skillId: requestedSkillId,
      scopedTools: input.scopedTools,
      scopedHostToolIds: input.scopedHostToolIds,
      forRequestedSkill: true,
    });
    if (!requested) {
      return skills;
    }
    return [...skills, requested];
  }

  /**
   * Plan / 展开：intent HTTP scoped ∩ Skill 绑定；当前页 Host Tool scoped ∩ Skill 绑定（含纯 Host Skill）。
   */
  async listResolvableSkillsForScopedTools(
    input: ListAvailableSkillsInput,
  ): Promise<AvailableSkillRow[]> {
    const roleContext = await this.resolveRoleContext(
      input.userId,
      input.appClientId,
    );
    if (!roleContext) {
      return [];
    }
    const scopedToolIds = new Set(input.scopedTools.map((tool) => tool.id));
    const queryBase = {
      appClientId: input.appClientId,
      agentId: input.agentId,
      roleId: roleContext.roleId,
      roleSkillFiltered: roleContext.roleSkillFiltered,
    };
    const runnableHostToolIds = await this.loadAgentRunnableHostToolIds(
      input.appClientId,
      input.agentId,
    );
    const scopedHostToolIdSet = this.toScopedHostToolIdSet(
      input.scopedHostToolIds,
      runnableHostToolIds,
    );
    const httpRows =
      scopedToolIds.size > 0
        ? await this.queryAgentSkills({
            ...queryBase,
            toolIdFilter: [...scopedToolIds],
          })
        : [];
    const hostRows =
      scopedHostToolIdSet.size > 0
        ? await this.queryPureHostSkills({
            ...queryBase,
            hostToolIdFilter: [...scopedHostToolIdSet],
          })
        : [];
    const hostBoundRows =
      scopedHostToolIdSet.size > 0
        ? await this.queryHostBoundSkills({
            ...queryBase,
            hostToolIdFilter: [...scopedHostToolIdSet],
          })
        : [];
    const workflowRows = await this.queryAgentSkills({
      ...queryBase,
      workflowBoundOnly: true,
    });
    const rows = this.mergeSkillDbRows(
      httpRows,
      hostRows,
      hostBoundRows,
      workflowRows,
    );
    return rows
      .map((row) =>
        this.toAvailableSkillRowIfResolvable(
          row,
          runnableHostToolIds,
          scopedToolIds,
          scopedHostToolIdSet,
          false,
        ),
      )
      .filter((row): row is AvailableSkillRow => row != null)
      .map((row) => this.narrowHostToolIdsToPageScope(row, scopedHostToolIdSet));
  }

  /** @deprecated 使用 listResolvableSkillsForScopedTools */
  async listAvailableSkillsForScopedTools(
    input: ListAvailableSkillsInput,
  ): Promise<AvailableSkillRow[]> {
    return this.listResolvableSkillsForScopedTools(input);
  }

  /** 预热：角色可见的全部 active Skill（不按 runnable 过滤）。 */
  async listAgentSkillsForUser(
    input: ListAgentSkillsInput,
  ): Promise<AgentSkillWarmupRow[]> {
    return this.agentSkillCatalogService.listAgentSkillsForUser(input);
  }

  /** C 端 / 会话预热：角色可见且用户可运行的 Skill 摘要。 */
  async listRunnableAgentSkillsForUser(
    input: ListAgentSkillsInput,
    allowedToolIds: ReadonlySet<number>,
  ): Promise<AgentSkillWarmupRow[]> {
    const rows = await this.listAgentSkillsForUser(input);
    return rows.filter(
      (skill) =>
        skillIsWorkflowBound(skill) ||
        skillIsRunnableForUser(skill, allowedToolIds),
    );
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

  async tryBuildTaskPlanFromSkillWorkflow(input: {
    appClientId: number;
    userMessage: string;
    skill: Pick<
      AvailableSkillRow,
      'workflowId' | 'workflowVersion' | 'workflowOverrides'
    >;
    goal?: string;
  }): Promise<TaskPlanSnapshot | null> {
    if (input.skill.workflowId == null || input.skill.workflowId <= 0) {
      return null;
    }
    return tryBuildTaskPlanFromSkillWorkflow(this.prisma, {
      appClientId: input.appClientId,
      userMessage: input.userMessage,
      binding: {
        workflowId: input.skill.workflowId,
        workflowVersion: input.skill.workflowVersion,
        workflowOverrides: input.skill.workflowOverrides,
      },
      goal: input.goal,
    });
  }

  private async queryHostBoundSkills(input: {
    appClientId: number;
    agentId: number;
    roleId: number;
    roleSkillFiltered: boolean;
    hostToolIdFilter: number[];
  }): Promise<SkillDbRow[]> {
    if (input.hostToolIdFilter.length === 0) {
      return [];
    }
    return this.queryAgentSkills({
      appClientId: input.appClientId,
      agentId: input.agentId,
      roleId: input.roleId,
      roleSkillFiltered: input.roleSkillFiltered,
      hostToolIdFilter: input.hostToolIdFilter,
      hostBoundWithHttp: true,
    });
  }

  private narrowHostToolIdsToPageScope(
    row: AvailableSkillRow,
    scopedHostToolIds: ReadonlySet<number>,
  ): AvailableSkillRow {
    if (scopedHostToolIds.size === 0) {
      return row;
    }
    const hostToolIds = row.hostToolIds.filter((hostToolId) =>
      scopedHostToolIds.has(hostToolId),
    );
    return {
      ...row,
      hostToolIds,
      runnableKind: deriveSkillRunnableKind({
        skillToolIds: row.skillToolIds,
        hostToolIds,
      }),
    };
  }

  private async queryPureHostSkills(input: {
    appClientId: number;
    agentId: number;
    roleId: number;
    roleSkillFiltered: boolean;
    hostToolIdFilter: number[];
  }): Promise<SkillDbRow[]> {
    if (input.hostToolIdFilter.length === 0) {
      return [];
    }
    return this.queryAgentSkills({
      appClientId: input.appClientId,
      agentId: input.agentId,
      roleId: input.roleId,
      roleSkillFiltered: input.roleSkillFiltered,
      pureHostOnly: true,
      hostToolIdFilter: input.hostToolIdFilter,
    });
  }

  private toScopedHostToolIdSet(
    scopedHostToolIds: number[] | undefined,
    runnableHostToolIds: ReadonlySet<number>,
  ): ReadonlySet<number> {
    if (!scopedHostToolIds?.length) {
      return new Set();
    }
    return new Set(
      scopedHostToolIds.filter((hostToolId) =>
        runnableHostToolIds.has(hostToolId),
      ),
    );
  }

  private mergeSkillDbRows(...groups: SkillDbRow[][]): SkillDbRow[] {
    const byId = new Map<number, SkillDbRow>();
    for (const rows of groups) {
      for (const row of rows) {
        byId.set(row.id, row);
      }
    }
    return [...byId.values()];
  }

  private toAvailableSkillRowIfResolvable(
    row: SkillDbRow,
    runnableHostToolIds: ReadonlySet<number>,
    scopedToolIds: ReadonlySet<number>,
    scopedHostToolIds: ReadonlySet<number>,
    forRequestedSkill: boolean,
  ): AvailableSkillRow | null {
    const skillToolIds = row.skillTools.map((skillTool) => skillTool.toolId);
    const hostToolIds = this.resolveRunnableHostToolIds(
      row,
      runnableHostToolIds,
    );
    const caps = {
      skillToolIds,
      hostToolIds,
      workflowId: row.workflowId,
    };
    const resolvable = forRequestedSkill
      ? skillIsResolvableForRequested(caps)
      : skillIsResolvableInScope(caps, scopedToolIds, scopedHostToolIds);
    if (!resolvable) {
      return null;
    }
    return this.narrowHostToolIdsToPageScope(
      this.toAvailableSkillRow(row, hostToolIds),
      scopedHostToolIds,
    );
  }

  private async loadAgentRunnableHostToolIds(
    appClientId: number,
    agentId: number,
  ): Promise<ReadonlySet<number>> {
    const ids = await loadAgentHostToolCandidateIds(
      this.prisma,
      appClientId,
      agentId,
    );
    return new Set(ids);
  }

  private resolveRunnableHostToolIds(
    row: Pick<SkillDbRow, 'skillHostTools'>,
    runnableHostToolIds: ReadonlySet<number>,
  ): number[] {
    return row.skillHostTools
      .map((binding) => binding.hostToolId)
      .filter((hostToolId) => runnableHostToolIds.has(hostToolId));
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
    appClientId: number;
    agentId: number;
    roleId: number;
    roleSkillFiltered: boolean;
    toolIdFilter?: number[];
    skillId?: number;
    pureHostOnly?: boolean;
    hostBoundWithHttp?: boolean;
    hostToolIdFilter?: number[];
    workflowBoundOnly?: boolean;
  }): Promise<SkillDbRow[]> {
    const hostToolIdFilter = input.hostToolIdFilter ?? [];
    const skillCtx = await loadAgentSkillVisibilityContext(
      this.prisma,
      input.appClientId,
      input.agentId,
    );
    return this.prisma.skill.findMany({
      where: {
        ...buildAgentSkillVisibilityWhere({
          appClientId: input.appClientId,
          agentId: input.agentId,
          restrictSkills: skillCtx.restrictSkills,
          skillWhitelistIds: skillCtx.skillWhitelistIds,
        }),
        ...(input.skillId != null ? { id: input.skillId } : {}),
        ...(input.workflowBoundOnly
          ? {
              workflowId: { not: null },
              workflow: { is: { isActive: true } },
            }
          : input.pureHostOnly
          ? {
              skillTools: { none: {} },
              skillHostTools: {
                some: { hostToolId: { in: hostToolIdFilter } },
              },
            }
          : input.hostBoundWithHttp && hostToolIdFilter.length > 0
            ? {
                skillTools: { some: {} },
                skillHostTools: {
                  some: { hostToolId: { in: hostToolIdFilter } },
                },
              }
          : input.toolIdFilter && input.toolIdFilter.length > 0
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
        workflowId: true,
        workflowVersion: true,
        workflowOverrides: true,
        skillTools: { select: { toolId: true } },
        skillHostTools: { select: { hostToolId: true } },
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

  private toAvailableSkillRow(
    row: SkillDbRow,
    hostToolIds: number[],
  ): AvailableSkillRow {
    const skillToolIds = row.skillTools.map((skillTool) => skillTool.toolId);
    return {
      ...this.toActiveSkillSnapshot(row),
      skillToolIds,
      hostToolIds,
      runnableKind: deriveSkillRunnableKind({ skillToolIds, hostToolIds }),
      workflowId: row.workflowId,
      workflowVersion: row.workflowVersion,
      workflowOverrides: row.workflowOverrides,
    };
  }
}
