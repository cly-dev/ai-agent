import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AgentChatPageContext } from '../../core/host-bridge';
import { resolveHostToolPageScope } from '../../core/host-bridge/page-context-anchor.util';
import {
  resolveAgentHostToolCandidateIds,
  resolveAgentToolCandidateIds,
  resolveEffectiveRestrictSkills,
} from '../../core/runtime-cache/capability-candidate.util';
import {
  buildRoleAccessibleToolWhere,
  resolveMaxToolLevel,
} from '../agent/util/agent-client-access.util';
import type { UserRoleToolAccessContext } from '../agent/util/agent-client-access.util';

export type AgentAutoSelectSource =
  | 'requested'
  | 'session'
  | 'auto'
  | 'default'
  | 'fallback';

export type AgentAutoSelectInput = {
  appClientId: number;
  userId: number;
  userMessage: string;
  pageContext?: AgentChatPageContext | null;
  requestedAgentId?: number;
  sessionAgentId?: number | null;
};

export type AgentAutoSelectResult = {
  agentId: number;
  source: AgentAutoSelectSource;
  confidence?: number;
  reason: string;
};

type AgentCandidate = {
  id: number;
  name: string;
  description: string | null;
  config: Prisma.JsonValue | null;
  tools: Array<{
    id: number;
    name: string;
    description: string;
    definitionKey: string;
    agentMetadata: Prisma.JsonValue | null;
  }>;
  skills: Array<{
    id: number;
    name: string;
    description: string | null;
    capabilityKey: string | null;
  }>;
  hostTools: Array<{
    id: number;
    name: string;
    description: string;
    definitionKey: string;
    hostPageScope: string | null;
  }>;
};

type ScoredAgentCandidate = AgentCandidate & {
  score: number;
  reasons: string[];
  isConfiguredDefault: boolean;
};

type AgentRow = {
  id: number;
  name: string;
  description: string | null;
  config: Prisma.JsonValue | null;
  restrictTools: boolean;
  restrictHostTools: boolean;
  restrictSkills: boolean;
};

function groupByAgentId<T extends { agentId: number }>(
  rows: T[],
): Map<number, T[]> {
  const grouped = new Map<number, T[]>();
  for (const row of rows) {
    const bucket = grouped.get(row.agentId);
    if (bucket) {
      bucket.push(row);
    } else {
      grouped.set(row.agentId, [row]);
    }
  }
  return grouped;
}

const AUTO_AGENT_MIN_SCORE = 20;
const AUTO_AGENT_CLEAR_WIN_MARGIN = 10;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function isConfiguredDefault(config: Prisma.JsonValue | null): boolean {
  if (!isRecord(config)) {
    return false;
  }
  const autoAgent = config.autoAgent;
  return (
    config.isDefault === true ||
    config.default === true ||
    config.autoAgentDefault === true ||
    (isRecord(autoAgent) && autoAgent.default === true)
  );
}

function collectText(value: unknown, out: string[]): void {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) {
      out.push(trimmed);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value.slice(0, 20)) {
      collectText(item, out);
    }
    return;
  }
  if (isRecord(value)) {
    for (const item of Object.values(value).slice(0, 40)) {
      collectText(item, out);
    }
  }
}

function normalizeSearchText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function textSimilarityScore(input: {
  query: string;
  target: string;
  maxScore: number;
}): number {
  const query = normalizeSearchText(input.query);
  const target = normalizeSearchText(input.target);
  if (!query || !target) {
    return 0;
  }
  if (target.includes(query) || query.includes(target)) {
    return input.maxScore;
  }
  const queryParts = query
    .split(/[\s,.;:!?()[\]{}"'`/\\|_-]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);
  if (queryParts.length === 0) {
    return 0;
  }
  const matched = queryParts.filter((part) => target.includes(part)).length;
  return Math.round((matched / queryParts.length) * input.maxScore);
}

export class AgentAutoSelectService {
  private readonly logger = new Logger(AgentAutoSelectService.name);

  constructor(private readonly prisma: PrismaService) {}

  async select(input: AgentAutoSelectInput): Promise<AgentAutoSelectResult> {
    const candidates = await this.loadCandidates(input);

    if (input.requestedAgentId != null) {
      const requested = candidates.find(
        (candidate) => candidate.id === input.requestedAgentId,
      );
      if (!requested) {
        await this.assertAgentBelongsToApp(
          input.requestedAgentId,
          input.appClientId,
        );
        throw new BadRequestException({
          code: 'AGENT_NOT_AVAILABLE',
          message: `agent ${input.requestedAgentId} is not available for current user`,
        });
      }
      return {
        agentId: input.requestedAgentId,
        source: 'requested',
        reason: 'requested agentId',
      };
    }

    if (input.sessionAgentId != null) {
      const sessionCandidate = candidates.find(
        (candidate) => candidate.id === input.sessionAgentId,
      );
      if (sessionCandidate) {
        return {
          agentId: input.sessionAgentId,
          source: 'session',
          reason: 'session bound agentId',
        };
      }
      this.logger.warn(
        `session bound agent unavailable; reselecting appClientId=${input.appClientId} userId=${input.userId} sessionAgentId=${input.sessionAgentId}`,
      );
    }

    if (candidates.length === 0) {
      throw new BadRequestException({
        code: 'NO_AVAILABLE_AGENT',
        message: '当前应用未配置当前用户可用的 Agent，请联系管理员配置 Agent。',
      });
    }

    const scored = this.scoreCandidates(candidates, input);
    const [best, second] = scored;
    const configuredDefault = scored.find((row) => row.isConfiguredDefault);
    const selected =
      best &&
      best.score >= AUTO_AGENT_MIN_SCORE &&
      (!second || best.score - second.score >= AUTO_AGENT_CLEAR_WIN_MARGIN)
        ? {
            agentId: best.id,
            source: 'auto' as const,
            confidence: Math.min(1, best.score / 100),
            reason: best.reasons.join('; ') || 'highest auto-agent score',
          }
        : configuredDefault
        ? {
            agentId: configuredDefault.id,
            source: 'default' as const,
            confidence: Math.min(1, configuredDefault.score / 100),
            reason: 'configured default agent',
          }
        : {
            agentId: scored[0].id,
            source: 'fallback' as const,
            confidence: Math.min(1, scored[0].score / 100),
            reason: 'first available agent fallback',
          };

    this.logger.debug(
      `auto agent selected appClientId=${input.appClientId} userId=${input.userId} agentId=${selected.agentId} source=${selected.source} reason="${selected.reason}" candidates=${scored.length}`,
    );
    return selected;
  }

  private async loadCandidates(
    input: AgentAutoSelectInput,
  ): Promise<AgentCandidate[]> {
    await this.assertAppClientExists(input.appClientId);
    const roleCtx = await this.resolveUserRoleToolContext(
      input.userId,
      input.appClientId,
    );
    if (!roleCtx) {
      return [];
    }

    const [
      accessibleTools,
      roleHostToolRows,
      agents,
      appActiveTools,
      appActiveHostTools,
      appActiveSkills,
    ] = await Promise.all([
      this.prisma.tool.findMany({
        where: buildRoleAccessibleToolWhere(input.appClientId, roleCtx, {}),
        select: { id: true },
      }),
      this.prisma.roleHostTool.findMany({
        where: {
          roleId: roleCtx.roleId,
          hostTool: { appClientId: input.appClientId, isActive: true },
        },
        select: { hostToolId: true },
      }),
      this.prisma.agent.findMany({
        where: { appClientId: input.appClientId },
        orderBy: { id: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          config: true,
          restrictTools: true,
          restrictHostTools: true,
          restrictSkills: true,
        },
      }),
      this.prisma.tool.findMany({
        where: { appClientId: input.appClientId, isActive: true },
        orderBy: { id: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          definitionKey: true,
          agentMetadata: true,
        },
      }),
      this.prisma.hostTool.findMany({
        where: { appClientId: input.appClientId, isActive: true },
        orderBy: { id: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          definitionKey: true,
          hostPage: { select: { scope: true } },
        },
      }),
      this.prisma.skill.findMany({
        where: { appClientId: input.appClientId, isActive: true },
        orderBy: { id: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          capabilityKey: true,
        },
      }),
    ]);

    if (agents.length === 0) {
      return [];
    }

    const agentIds = agents.map((agent) => agent.id);
    const [agentToolBindings, agentHostToolBindings, agentSkillBindings] =
      await Promise.all([
        this.prisma.agentTool.findMany({
          where: { agentId: { in: agentIds } },
          select: { agentId: true, toolId: true },
          orderBy: { toolId: 'asc' },
        }),
        this.prisma.agentHostTool.findMany({
          where: { agentId: { in: agentIds } },
          select: { agentId: true, hostToolId: true },
          orderBy: { hostToolId: 'asc' },
        }),
        this.prisma.agentSkill.findMany({
          where: { agentId: { in: agentIds } },
          select: { agentId: true, skillId: true },
          orderBy: { skillId: 'asc' },
        }),
      ]);

    const accessibleToolIds = new Set(accessibleTools.map((tool) => tool.id));
    const roleHostToolIds = new Set(
      roleHostToolRows.map((row) => row.hostToolId),
    );
    const appActiveToolIds = appActiveTools.map((tool) => tool.id);
    const appActiveHostToolIds = appActiveHostTools.map((tool) => tool.id);
    const appActiveSkillById = new Map(
      appActiveSkills.map((skill) => [skill.id, skill]),
    );
    const toolById = new Map(appActiveTools.map((tool) => [tool.id, tool]));
    const hostToolById = new Map(
      appActiveHostTools.map((hostTool) => [hostTool.id, hostTool]),
    );
    const agentToolsByAgent = groupByAgentId(agentToolBindings);
    const agentHostToolsByAgent = groupByAgentId(agentHostToolBindings);
    const agentSkillsByAgent = groupByAgentId(agentSkillBindings);

    const agentRows: AgentRow[] = agents;
    const candidates: AgentCandidate[] = [];
    for (const agent of agentRows) {
      const toolWhitelistIds =
        agentToolsByAgent.get(agent.id)?.map((row) => row.toolId) ?? [];
      const hostToolWhitelistIds =
        agentHostToolsByAgent.get(agent.id)?.map((row) => row.hostToolId) ?? [];
      const skillWhitelistIds =
        agentSkillsByAgent.get(agent.id)?.map((row) => row.skillId) ?? [];
      const toolCandidateIds = resolveAgentToolCandidateIds({
        restrictTools: agent.restrictTools,
        whitelistIds: toolWhitelistIds,
        appActiveIds: appActiveToolIds,
      });
      const hostToolCandidateIds = resolveAgentHostToolCandidateIds({
        restrictHostTools: agent.restrictHostTools,
        whitelistIds: hostToolWhitelistIds,
        appActiveIds: appActiveHostToolIds,
      });
      const allowedToolIds = toolCandidateIds.filter((toolId) =>
        accessibleToolIds.has(toolId),
      );
      const allowedHostToolIds =
        roleHostToolIds.size === 0
          ? []
          : hostToolCandidateIds.filter((hostToolId) =>
              roleHostToolIds.has(hostToolId),
            );
      if (allowedToolIds.length === 0 && allowedHostToolIds.length === 0) {
        continue;
      }

      const tools = allowedToolIds
        .map((toolId) => toolById.get(toolId))
        .filter((tool): tool is NonNullable<typeof tool> => tool != null);
      const hostTools = allowedHostToolIds
        .map((hostToolId) => hostToolById.get(hostToolId))
        .filter(
          (hostTool): hostTool is NonNullable<typeof hostTool> =>
            hostTool != null,
        );
      const skillVisibilityTightened = resolveEffectiveRestrictSkills(
        {
          restrictSkills: agent.restrictSkills,
        },
        {
          skillBindings: skillWhitelistIds.length,
        },
      );
      const skills = (
        skillVisibilityTightened
          ? skillWhitelistIds
              .map((skillId) => appActiveSkillById.get(skillId))
              .filter(
                (skill): skill is NonNullable<typeof skill> => skill != null,
              )
          : appActiveSkills
      ).slice(0, 20);

      candidates.push({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        config: agent.config,
        tools,
        skills,
        hostTools: hostTools.map((hostTool) => ({
          id: hostTool.id,
          name: hostTool.name,
          description: hostTool.description,
          definitionKey: hostTool.definitionKey,
          hostPageScope: hostTool.hostPage?.scope ?? null,
        })),
      });
    }
    return candidates;
  }

  private scoreCandidates(
    candidates: AgentCandidate[],
    input: AgentAutoSelectInput,
  ): ScoredAgentCandidate[] {
    const pageScope = resolveHostToolPageScope(input.pageContext ?? null);
    return candidates
      .map((candidate) => {
        let score = 0;
        const reasons: string[] = [];
        const configuredDefault = isConfiguredDefault(candidate.config);
        if (configuredDefault) {
          score += 10;
          reasons.push('configured default');
        }
        if (
          pageScope &&
          candidate.hostTools.some((tool) => tool.hostPageScope === pageScope)
        ) {
          score += 40;
          reasons.push(`host page scope matched (${pageScope})`);
        }
        const searchable: string[] = [
          candidate.name,
          candidate.description ?? '',
        ];
        for (const skill of candidate.skills) {
          searchable.push(
            skill.name,
            skill.description ?? '',
            skill.capabilityKey ?? '',
          );
        }
        for (const tool of candidate.tools) {
          searchable.push(tool.name, tool.description, tool.definitionKey);
          collectText(tool.agentMetadata, searchable);
        }
        for (const hostTool of candidate.hostTools) {
          searchable.push(
            hostTool.name,
            hostTool.description,
            hostTool.definitionKey,
          );
        }
        const textScore = textSimilarityScore({
          query: input.userMessage,
          target: searchable.join('\n'),
          maxScore: 50,
        });
        if (textScore > 0) {
          score += textScore;
          reasons.push(`capability text matched (${textScore})`);
        }
        return {
          ...candidate,
          score,
          reasons,
          isConfiguredDefault: configuredDefault,
        };
      })
      .sort((left, right) => right.score - left.score || left.id - right.id);
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
            roleTools: { select: { toolId: true } },
          },
        },
      },
    });
    if (!userApp) {
      return null;
    }
    return {
      roleId: userApp.roleId,
      maxLevel: resolveMaxToolLevel([userApp.role.allowToolLevel]),
      roleToolIds: userApp.role.roleTools.map((row) => row.toolId),
    };
  }

  private async assertAgentBelongsToApp(
    agentId: number,
    appClientId: number,
  ): Promise<void> {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, appClientId },
      select: { id: true },
    });
    if (!agent) {
      throw new BadRequestException(
        `agent ${agentId} not found or does not belong to this app client`,
      );
    }
  }

  private async assertAppClientExists(appClientId: number): Promise<void> {
    const row = await this.prisma.appClient.findUnique({
      where: { id: appClientId },
      select: { id: true },
    });
    if (!row) {
      throw new BadRequestException(`appClient ${appClientId} not found`);
    }
  }
}
