import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HOST_TOOL_DETAIL_INCLUDE } from '../../modules/host-tool/host-tool.types';
import { AgentHostToolCatalogStore } from './agent-host-tool-catalog.store';
import {
  resolveLlmHostToolsFromCatalog,
} from './host-tool-catalog-resolve.util';
import { resolveAgentHostToolCandidateIds } from './capability-candidate.util';
import { logRuntimeCacheEvent } from './runtime-cache-observability.util';
import {
  buildHostToolCatalogRevision,
  toRevisionIso,
} from './runtime-revision.util';
import type {
  AgentHostToolCatalogSnapshot,
  AgentHostToolSkillBindingRow,
} from './runtime-cache.types';
import type { HostToolDecisionDefinition } from '../host-bridge';
import {
  HostToolSkillTrigger,
} from '../../../generated/prisma/client';

const LLM_SKILL_TRIGGERS: HostToolSkillTrigger[] = [
  HostToolSkillTrigger.LLM_SCOPED,
  HostToolSkillTrigger.ON_PLAN_STEP,
];

@Injectable()
export class AgentHostToolCatalogService {
  private readonly logger = new Logger(AgentHostToolCatalogService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogStore: AgentHostToolCatalogStore,
  ) {}

  async loadOrWarm(
    appClientId: number,
    agentId: number,
  ): Promise<AgentHostToolCatalogSnapshot | null> {
    const dbRevision = await this.fetchRevisionFromDb(appClientId, agentId);
    const cached = await this.catalogStore.get(appClientId, agentId);
    if (cached && cached.revision === dbRevision) {
      return cached;
    }
    if (cached && cached.revision !== dbRevision) {
      this.logger.debug(
        `host-tool catalog revision mismatch agentId=${agentId}, refreshing`,
      );
      return this.refresh(appClientId, agentId);
    }
    const built = await this.buildFromDb(appClientId, agentId);
    if (!built) {
      return null;
    }
    await this.catalogStore.trySet(built);
    return built;
  }

  async refresh(
    appClientId: number,
    agentId: number,
  ): Promise<AgentHostToolCatalogSnapshot | null> {
    const built = await this.buildFromDb(appClientId, agentId);
    if (!built) {
      await this.catalogStore.delete(appClientId, agentId);
      return null;
    }
    await this.catalogStore.trySet(built);
    return built;
  }

  async resolveLlmHostTools(input: {
    appClientId: number;
    agentId: number;
    skillId: number | null | undefined;
    pageScope: string;
  }): Promise<{
    tools: HostToolDecisionDefinition[];
    fromCache: boolean;
  }> {
    const pageScope = input.pageScope.trim();
    if (!pageScope) {
      return { tools: [], fromCache: false };
    }
    const cached = await this.catalogStore.get(input.appClientId, input.agentId);
    if (cached) {
      logRuntimeCacheEvent({
        layer: 'L2',
        operation: 'resolveLlmHostTools',
        cacheHit: true,
        agentId: input.agentId,
        appClientId: input.appClientId,
      });
      return {
        tools: resolveLlmHostToolsFromCatalog(cached, {
          pageScope,
          skillId: input.skillId,
          skillTriggers: LLM_SKILL_TRIGGERS,
        }),
        fromCache: true,
      };
    }
    const warmed = await this.loadOrWarm(input.appClientId, input.agentId);
    if (!warmed) {
      return { tools: [], fromCache: false };
    }
    logRuntimeCacheEvent({
      layer: 'L2',
      operation: 'resolveLlmHostTools',
      cacheHit: false,
      agentId: input.agentId,
      appClientId: input.appClientId,
    });
    return {
      tools: resolveLlmHostToolsFromCatalog(warmed, {
        pageScope,
        skillId: input.skillId,
        skillTriggers: LLM_SKILL_TRIGGERS,
      }),
      fromCache: false,
    };
  }

  async warmPageLlmTools(input: {
    appClientId: number;
    agentId: number;
    pageScope: string;
  }): Promise<HostToolDecisionDefinition[]> {
    const result = await this.resolveLlmHostTools({
      appClientId: input.appClientId,
      agentId: input.agentId,
      skillId: null,
      pageScope: input.pageScope,
    });
    return result.tools;
  }

  async fetchRevisionFromDb(
    appClientId: number,
    agentId: number,
  ): Promise<string> {
    const ctx = await this.loadHostToolCatalogContext(appClientId, agentId);
    if (!ctx) {
      return '';
    }
    return buildHostToolCatalogRevision({
      hostTools: ctx.revisionHostToolRows,
      skillBindings: ctx.revisionSkillBindingRows,
      agentBoundHostToolIds: ctx.candidateHostToolIds,
    });
  }

  private async buildFromDb(
    appClientId: number,
    agentId: number,
  ): Promise<AgentHostToolCatalogSnapshot | null> {
    const ctx = await this.loadHostToolCatalogContext(appClientId, agentId);
    if (!ctx) {
      return null;
    }

    if (ctx.candidateHostToolIds.length === 0) {
      return {
        appClientId,
        agentId,
        revision: buildHostToolCatalogRevision({
          hostTools: [],
          skillBindings: [],
          agentBoundHostToolIds: [],
        }),
        agentBoundHostToolIds: [],
        agentBoundTools: [],
        skillBindings: [],
        warmedAt: new Date().toISOString(),
      };
    }

    const [hostToolRows, skillBindingRows] = await Promise.all([
      this.prisma.hostTool.findMany({
        where: {
          id: { in: ctx.candidateHostToolIds },
          appClientId,
        },
        include: HOST_TOOL_DETAIL_INCLUDE,
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.skillHostTool.findMany({
        where: {
          hostToolId: { in: ctx.candidateHostToolIds },
          skill: { appClientId },
        },
        orderBy: [{ priority: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          skillId: true,
          hostToolId: true,
          trigger: true,
          isRequired: true,
          priority: true,
          argsTemplate: true,
          updatedAt: true,
        },
      }),
    ]);

    const agentBoundTools = hostToolRows.map((tool) => ({
      hostToolId: tool.id,
      definitionKey: tool.definitionKey,
      name: tool.name,
      description: tool.description,
      hostPageScope: tool.hostPage?.scope ?? null,
      argsSchema:
        tool.argsSchema &&
        typeof tool.argsSchema === 'object' &&
        !Array.isArray(tool.argsSchema)
          ? (tool.argsSchema as Record<string, unknown>)
          : { type: 'object' },
      argsTemplate: tool.argsTemplate,
      config: tool.config,
      isActive: tool.isActive,
      updatedAt: toRevisionIso(tool.updatedAt),
    }));

    const skillBindings: AgentHostToolSkillBindingRow[] = skillBindingRows.map(
      (row) => ({
        skillId: row.skillId,
        hostToolId: row.hostToolId,
        trigger: row.trigger,
        isRequired: row.isRequired,
        priority: row.priority,
        argsTemplate: row.argsTemplate,
        updatedAt: toRevisionIso(row.updatedAt),
      }),
    );

    return {
      appClientId,
      agentId,
      revision: buildHostToolCatalogRevision({
        hostTools: hostToolRows.map((row) => ({
          id: row.id,
          updatedAt: row.updatedAt,
        })),
        skillBindings: skillBindingRows.map((row) => ({
          id: row.id,
          updatedAt: row.updatedAt,
        })),
        agentBoundHostToolIds: ctx.candidateHostToolIds,
      }),
      agentBoundHostToolIds: ctx.candidateHostToolIds,
      agentBoundTools,
      skillBindings,
      warmedAt: new Date().toISOString(),
    };
  }

  private async loadHostToolCatalogContext(
    appClientId: number,
    agentId: number,
  ): Promise<{
    candidateHostToolIds: number[];
    revisionHostToolRows: Array<{ id: number; updatedAt: Date }>;
    revisionSkillBindingRows: Array<{ id: number; updatedAt: Date }>;
  } | null> {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, appClientId },
      select: { id: true, restrictHostTools: true },
    });
    if (!agent) {
      return null;
    }
    const [agentBindings, appActiveHostTools] = await Promise.all([
      this.prisma.agentHostTool.findMany({
        where: { agentId },
        select: { hostToolId: true },
        orderBy: { hostToolId: 'asc' },
      }),
      this.prisma.hostTool.findMany({
        where: { appClientId, isActive: true },
        select: { id: true, updatedAt: true },
        orderBy: { id: 'asc' },
      }),
    ]);
    const candidateHostToolIds = resolveAgentHostToolCandidateIds({
      restrictHostTools: agent.restrictHostTools,
      whitelistIds: agentBindings.map((row) => row.hostToolId),
      appActiveIds: appActiveHostTools.map((row) => row.id),
    });
    const candidateSet = new Set(candidateHostToolIds);
    const revisionHostToolRows = appActiveHostTools.filter((row) =>
      candidateSet.has(row.id),
    );
    let revisionSkillBindingRows: Array<{ id: number; updatedAt: Date }> = [];
    if (candidateHostToolIds.length > 0) {
      revisionSkillBindingRows = await this.prisma.skillHostTool.findMany({
        where: {
          hostToolId: { in: candidateHostToolIds },
          skill: { appClientId },
        },
        select: { id: true, updatedAt: true },
        orderBy: { id: 'asc' },
      });
    }
    return {
      candidateHostToolIds,
      revisionHostToolRows,
      revisionSkillBindingRows,
    };
  }
}
