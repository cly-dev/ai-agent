import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  resolveMaxToolLevel,
  type UserRoleToolAccessContext,
} from '../../modules/agent/util/agent-client-access.util';
import { AgentToolCatalogStore } from './agent-tool-catalog.store';
import { AGENT_TOOL_CATALOG_INCLUDE } from './agent-tool-catalog.types';
import type { AgentToolCatalogRow } from './agent-tool-catalog.types';
import { resolveAgentToolCandidateIds } from './capability-candidate.util';
import { resolveAllowedToolsFromCatalog } from './agent-tool-catalog.util';
import { logRuntimeCacheEvent } from './runtime-cache-observability.util';
import {
  buildToolsRuntimeRevision,
  toRevisionIso,
} from './runtime-revision.util';
import type {
  AgentToolCatalogSnapshot,
  RuntimeRevision,
} from './runtime-cache.types';

@Injectable()
export class AgentToolCatalogService {
  private readonly logger = new Logger(AgentToolCatalogService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogStore: AgentToolCatalogStore,
  ) {}

  async resolveAllowedTools(
    agentId: number,
    userId: number,
    appClientId: number,
  ): Promise<AgentToolCatalogRow[]> {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, appClientId },
      select: { id: true },
    });
    if (!agent) {
      throw new NotFoundException(`agent ${agentId} not found`);
    }
    const roleCtx = await this.resolveUserRoleToolContext(userId, appClientId);
    if (!roleCtx) {
      return [];
    }
    const catalog = await this.loadOrWarm(appClientId, agentId);
    if (!catalog) {
      return [];
    }
    return resolveAllowedToolsFromCatalog(catalog, roleCtx);
  }

  async loadOrWarm(
    appClientId: number,
    agentId: number,
  ): Promise<AgentToolCatalogSnapshot | null> {
    const dbRevision = await this.fetchRevisionFromDb(appClientId, agentId);
    const cached = await this.catalogStore.get(appClientId, agentId);
    if (cached && cached.revision === dbRevision) {
      logRuntimeCacheEvent({
        layer: 'L2',
        operation: 'loadAgentToolCatalog',
        cacheHit: true,
        agentId,
        appClientId,
      });
      return cached;
    }
    if (cached && cached.revision !== dbRevision) {
      this.logger.debug(
        `tool catalog revision mismatch agentId=${agentId}, refreshing`,
      );
      return this.refresh(appClientId, agentId);
    }
    const built = await this.buildFromDb(appClientId, agentId);
    if (!built) {
      return null;
    }
    await this.catalogStore.trySet(built);
    logRuntimeCacheEvent({
      layer: 'L2',
      operation: 'loadAgentToolCatalog',
      cacheHit: false,
      agentId,
      appClientId,
    });
    return built;
  }

  async refresh(
    appClientId: number,
    agentId: number,
  ): Promise<AgentToolCatalogSnapshot | null> {
    const built = await this.buildFromDb(appClientId, agentId);
    if (!built) {
      await this.catalogStore.delete(appClientId, agentId);
      return null;
    }
    await this.catalogStore.trySet(built);
    return built;
  }

  async fetchRevisionFromDb(
    appClientId: number,
    agentId: number,
  ): Promise<string> {
    const ctx = await this.loadToolCatalogContext(appClientId, agentId);
    if (!ctx) {
      return '';
    }
    const { tools: toolsPart, integrations } = buildToolsRuntimeRevision(
      ctx.revisionToolRows,
    );
    return `${toolsPart}|${integrations}|r:${ctx.agent.restrictTools ? 1 : 0}`;
  }

  /** 仅拉 id/updatedAt 指纹，用于 L1 session prepare 缓存校验（避免全量 getAllowedTools）。 */
  async fetchRuntimeRevisionParts(
    appClientId: number,
    agentId: number,
  ): Promise<Pick<RuntimeRevision, 'tools' | 'integrations'>> {
    const ctx = await this.loadToolCatalogContext(appClientId, agentId);
    if (!ctx) {
      return { tools: '', integrations: '' };
    }
    return buildToolsRuntimeRevision(ctx.revisionToolRows);
  }

  private async buildFromDb(
    appClientId: number,
    agentId: number,
  ): Promise<AgentToolCatalogSnapshot | null> {
    const ctx = await this.loadToolCatalogContext(appClientId, agentId);
    if (!ctx) {
      return null;
    }
    const tools =
      ctx.candidateToolIds.length === 0
        ? []
        : await this.prisma.tool.findMany({
            where: {
              id: { in: ctx.candidateToolIds },
              appClientId,
            },
            include: AGENT_TOOL_CATALOG_INCLUDE,
            orderBy: { id: 'asc' },
          });
    const revision = await this.fetchRevisionFromDb(appClientId, agentId);
    return {
      appClientId,
      agentId,
      revision,
      agentBoundToolIds: ctx.candidateToolIds,
      tools,
      warmedAt: new Date().toISOString(),
    };
  }

  private async loadToolCatalogContext(
    appClientId: number,
    agentId: number,
  ): Promise<{
    agent: { restrictTools: boolean };
    candidateToolIds: number[];
    revisionToolRows: Array<{
      id: number;
      updatedAt: Date;
      integration: { id: number; updatedAt: Date };
    }>;
  } | null> {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, appClientId },
      select: { id: true, restrictTools: true },
    });
    if (!agent) {
      return null;
    }
    const [agentBindings, appActiveTools] = await Promise.all([
      this.prisma.agentTool.findMany({
        where: { agentId },
        select: { toolId: true },
        orderBy: { toolId: 'asc' },
      }),
      this.prisma.tool.findMany({
        where: { appClientId, isActive: true },
        select: {
          id: true,
          updatedAt: true,
          integration: { select: { id: true, updatedAt: true } },
        },
        orderBy: { id: 'asc' },
      }),
    ]);
    const candidateToolIds = resolveAgentToolCandidateIds({
      restrictTools: agent.restrictTools,
      whitelistIds: agentBindings.map((row) => row.toolId),
      appActiveIds: appActiveTools.map((row) => row.id),
    });
    const candidateSet = new Set(candidateToolIds);
    const revisionToolRows = appActiveTools.filter((row) =>
      candidateSet.has(row.id),
    );
    return {
      agent,
      candidateToolIds,
      revisionToolRows,
    };
  }

  private async resolveUserRoleToolContext(
    userId: number,
    appClientId: number,
  ): Promise<UserRoleToolAccessContext | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException(`user ${userId} not found`);
    }
    const userApp = await this.prisma.userApp.findFirst({
      where: { userId: user.id, appId: appClientId },
      select: {
        roleId: true,
        role: {
          select: {
            allowToolLevel: true,
            roleTools: {
              select: { toolId: true },
            },
          },
        },
      },
    });
    if (!userApp) {
      return null;
    }
    const roleToolIds = userApp.role.roleTools.map((row) => row.toolId);
    return {
      roleId: userApp.roleId,
      maxLevel: resolveMaxToolLevel([userApp.role.allowToolLevel]),
      roleToolIds,
    };
  }
}
