import { Injectable, Logger } from '@nestjs/common';
import type { AgentSkillWarmupRow } from '../skill/skill.types';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentSkillCatalogStore } from './agent-skill-catalog.store';
import {
  loadAgentHostToolCandidateIds,
  loadAgentSkillVisibilityContext,
} from './agent-capability-load.util';
import { buildAgentSkillVisibilityWhere } from './capability-candidate.util';
import { logRuntimeCacheEvent } from './runtime-cache-observability.util';
import {
  buildEntityRevisionsFingerprint,
  toRevisionIso,
} from './runtime-revision.util';
import type {
  AgentSkillCatalogRow,
  AgentSkillCatalogSnapshot,
} from './runtime-cache.types';

@Injectable()
export class AgentSkillCatalogService {
  private readonly logger = new Logger(AgentSkillCatalogService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogStore: AgentSkillCatalogStore,
  ) {}

  async listAgentSkillsForUser(input: {
    agentId: number;
    userId: number;
    appClientId: number;
  }): Promise<AgentSkillWarmupRow[]> {
    const roleContext = await this.resolveRoleContext(
      input.userId,
      input.appClientId,
    );
    if (!roleContext) {
      return [];
    }
    const catalog = await this.loadOrWarm({
      appClientId: input.appClientId,
      agentId: input.agentId,
      roleId: roleContext.roleId,
      roleSkillFiltered: roleContext.roleSkillFiltered,
    });
    if (!catalog) {
      return [];
    }
    const runnableHostToolIds = new Set(catalog.runnableHostToolIds);
    return catalog.skills.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      capabilityKey: row.capabilityKey,
      riskLevel: row.riskLevel,
      toolIds: row.toolIds,
      hostToolIds: row.skillHostToolIds.filter((hostToolId) =>
        runnableHostToolIds.has(hostToolId),
      ),
      workflowId: row.workflowId,
      workflowVersion: row.workflowVersion,
      flowId: row.flowId,
      flowVersion: row.flowVersion,
    }));
  }

  async loadOrWarm(input: {
    appClientId: number;
    agentId: number;
    roleId: number;
    roleSkillFiltered: boolean;
  }): Promise<AgentSkillCatalogSnapshot | null> {
    const dbRevision = await this.fetchRevisionFromDb(input);
    const cached = await this.catalogStore.get(
      input.appClientId,
      input.agentId,
      input.roleId,
    );
    if (cached && cached.revision === dbRevision) {
      logRuntimeCacheEvent({
        layer: 'L2',
        operation: 'loadAgentSkillCatalog',
        cacheHit: true,
        agentId: input.agentId,
        appClientId: input.appClientId,
        extra: { roleId: input.roleId },
      });
      return cached;
    }
    if (cached && cached.revision !== dbRevision) {
      this.logger.debug(
        `skill catalog revision mismatch agentId=${input.agentId} roleId=${input.roleId}, refreshing`,
      );
      return this.refresh(input);
    }
    const built = await this.buildFromDb(input);
    if (!built) {
      return null;
    }
    await this.catalogStore.trySet(built);
    logRuntimeCacheEvent({
      layer: 'L2',
      operation: 'loadAgentSkillCatalog',
      cacheHit: false,
      agentId: input.agentId,
      appClientId: input.appClientId,
      extra: { roleId: input.roleId },
    });
    return built;
  }

  async refresh(input: {
    appClientId: number;
    agentId: number;
    roleId: number;
    roleSkillFiltered: boolean;
  }): Promise<AgentSkillCatalogSnapshot | null> {
    const built = await this.buildFromDb(input);
    if (!built) {
      return null;
    }
    await this.catalogStore.trySet(built);
    return built;
  }

  async fetchRevisionFromDb(input: {
    appClientId: number;
    agentId: number;
    roleId: number;
    roleSkillFiltered: boolean;
  }): Promise<string> {
    const skills = await this.querySkills(input);
    const skillPart = buildEntityRevisionsFingerprint(
      skills.map((row) => ({ id: row.id, updatedAt: row.updatedAt })),
    );
    const hostCandidateIds = await loadAgentHostToolCandidateIds(
      this.prisma,
      input.appClientId,
      input.agentId,
    );
    const hostPart = hostCandidateIds.join(',');
    const skillCtx = await loadAgentSkillVisibilityContext(
      this.prisma,
      input.appClientId,
      input.agentId,
    );
    return `s:${skillPart}|h:${hostPart}|r:${input.roleId}|rs:${skillCtx.restrictSkills ? 1 : 0}`;
  }

  private async buildFromDb(input: {
    appClientId: number;
    agentId: number;
    roleId: number;
    roleSkillFiltered: boolean;
  }): Promise<AgentSkillCatalogSnapshot | null> {
    const agent = await this.prisma.agent.findFirst({
      where: { id: input.agentId, appClientId: input.appClientId },
      select: { id: true },
    });
    if (!agent) {
      return null;
    }
    const [skills, runnableHostToolIds] = await Promise.all([
      this.querySkills(input),
      loadAgentHostToolCandidateIds(
        this.prisma,
        input.appClientId,
        input.agentId,
      ),
    ]);
    const catalogSkills: AgentSkillCatalogRow[] = skills.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      capabilityKey: row.capabilityKey,
      riskLevel: row.riskLevel,
      updatedAt: toRevisionIso(row.updatedAt),
      toolIds: row.skillTools.map((skillTool) => skillTool.toolId),
      skillHostToolIds: row.skillHostTools.map(
        (binding) => binding.hostToolId,
      ),
      workflowId: row.workflowId,
      workflowVersion: row.workflowVersion,
      flowId: row.flowId,
      flowVersion: row.flowVersion,
    }));
    return {
      appClientId: input.appClientId,
      agentId: input.agentId,
      roleId: input.roleId,
      revision: await this.fetchRevisionFromDb(input),
      skills: catalogSkills,
      runnableHostToolIds,
      warmedAt: new Date().toISOString(),
    };
  }

  private async querySkills(input: {
    appClientId: number;
    agentId: number;
    roleId: number;
    roleSkillFiltered: boolean;
  }) {
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
        ...(input.roleSkillFiltered
          ? { roleSkills: { some: { roleId: input.roleId } } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        capabilityKey: true,
        riskLevel: true,
        updatedAt: true,
        workflowId: true,
        workflowVersion: true,
        flowId: true,
        flowVersion: true,
        skillTools: { select: { toolId: true } },
        skillHostTools: { select: { hostToolId: true } },
      },
      orderBy: { id: 'asc' },
    });
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
}
