import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import {
  resolvePagination,
  toPaginatedResult,
} from '../../common/pagination';
import { RuntimeCacheInvalidator } from '../../core/runtime-cache/runtime-cache-invalidator.service';
import { AgentToolCatalogService } from '../../core/runtime-cache/agent-tool-catalog.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  toAgentListResponseList,
  toAgentToolBindingItemList,
  toAgentToolsBindingResponse,
  toAgentWithToolsResponse,
} from './mapper/agent.mapper';
import {
  AGENT_LINKED_TOOL_SELECT,
  AGENT_LIST_INCLUDE,
  AGENT_WITH_TOOLS_INCLUDE,
  type AgentToolsBindingResponse,
  type AgentToolsPageResponse,
  type AgentClientListItem,
} from './types/agent.types';
import {
  buildAgentToolBindingsOrderBy,
  buildAgentToolBindingsWhere,
} from './util/agent-tool-query.util';
import type { QueryAgentToolsDto } from './dto/query-agent-tools.dto';
import { BindAgentToolsDto } from './dto/bind-agent-tools.dto';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { SessionPrepareStore } from '../chat/session-prepare.store';
import { AgentCacheStore } from './cache/agent-cache.store';
import type { AgentRuntimeSnapshot } from './cache/agent-runtime.types';
import { loadAgentToolCandidateIds } from '../../core/runtime-cache/agent-capability-load.util';
import {
  buildRoleAccessibleToolWhere,
  resolveMaxToolLevel,
  type UserRoleToolAccessContext,
} from './util/agent-client-access.util';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly agentCacheStore: AgentCacheStore,
    private readonly sessionPrepareStore: SessionPrepareStore,
    private readonly runtimeCacheInvalidator: RuntimeCacheInvalidator,
    private readonly agentToolCatalogService: AgentToolCatalogService,
  ) {}

  /**
   * Lazy cache-aside: Redis hit → return; miss → DB → trySet → return.
   * No full-table warm; only agents actually used get cached.
   */
  async getRuntimeAgent(
    appClientId: number,
    agentId: number,
  ): Promise<AgentRuntimeSnapshot | null> {
    const cached = await this.agentCacheStore.get(appClientId, agentId);
    if (cached) {
      return cached;
    }
    const row = await this.prisma.agent.findFirst({
      where: { id: agentId, appClientId },
      select: {
        id: true,
        appClientId: true,
        name: true,
        systemPrompt: true,
        maxSteps: true,
        enableToolCall: true,
        config: true,
      },
    });
    if (!row) {
      return null;
    }
    const snapshot: AgentRuntimeSnapshot = {
      id: row.id,
      appClientId: row.appClientId,
      name: row.name,
      systemPrompt: row.systemPrompt,
      maxSteps: row.maxSteps,
      enableToolCall: row.enableToolCall,
      config: row.config,
    };
    await this.agentCacheStore.trySet(appClientId, agentId, snapshot);
    return snapshot;
  }

  private async invalidateRuntimeCache(
    appClientId: number,
    agentId: number,
  ): Promise<void> {
    await this.agentCacheStore.delete(appClientId, agentId);
  }

  async create(dto: CreateAgentDto) {
    const hasToolBindings = Boolean(dto.toolIds && dto.toolIds.length > 0);
    const agent = await this.prisma.agent.create({
      data: {
        appClientId: dto.appClientId,
        name: dto.name,
        description: dto.description ?? null,
        systemPrompt: dto.systemPrompt,
        maxSteps: dto.maxSteps ?? 8,
        enableToolCall: dto.enableToolCall ?? true,
        restrictTools: dto.restrictTools ?? hasToolBindings,
        restrictHostTools: dto.restrictHostTools ?? false,
        restrictSkills: dto.restrictSkills ?? false,
        config: dto.config as Prisma.InputJsonValue | undefined,
      },
    });
    if (dto.toolIds && dto.toolIds.length > 0) {
      await this.prisma.agentTool.createMany({
        data: dto.toolIds.map((toolId) => ({
          agentId: agent.id,
          toolId,
        })),
        skipDuplicates: true,
      });
    }
    return this.findOneWithTools(agent.id);
  }

  async findAll() {
    const rows = await this.prisma.agent.findMany({
      orderBy: { id: 'asc' },
      include: AGENT_LIST_INCLUDE,
    });
    return toAgentListResponseList(rows);
  }

  async findByAppClientId(appClientId: number) {
    await this.assertAppClientExists(appClientId);
    return this.prisma.agent.findMany({
      where: { appClientId },
      orderBy: { id: 'asc' },
    });
  }

  /** C 端：当前 AppClient 下的 Agent 摘要列表。 */
  async findClientListByAppClientId(
    appClientId: number,
  ): Promise<AgentClientListItem[]> {
    await this.assertAppClientExists(appClientId);
    return this.prisma.agent.findMany({
      where: { appClientId },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });
  }

  /**
   * C 端：按用户 Role → RoleTool 与 Agent 绑定 Tool 的交集，返回可用 Agent 列表。
   */
  async findClientAvailableAgentsForUser(
    userId: number,
    appClientId: number,
  ): Promise<AgentClientListItem[]> {
    await this.assertAppClientExists(appClientId);
    const roleCtx = await this.resolveUserRoleToolContext(userId, appClientId);
    if (!roleCtx || roleCtx.roleToolIds.length === 0) {
      return [];
    }

    const accessibleTools = await this.prisma.tool.findMany({
      where: buildRoleAccessibleToolWhere(appClientId, roleCtx, {}),
      select: { id: true },
    });
    const accessibleToolIds = accessibleTools.map((tool) => tool.id);
    if (accessibleToolIds.length === 0) {
      return [];
    }

    const accessibleToolIdSet = new Set(accessibleToolIds);

    const agents = await this.prisma.agent.findMany({
      where: { appClientId },
      orderBy: { id: 'asc' },
      select: { id: true, name: true, description: true },
    });
    const available: AgentClientListItem[] = [];
    for (const agent of agents) {
      const candidateIds = await loadAgentToolCandidateIds(
        this.prisma,
        appClientId,
        agent.id,
      );
      const hasOverlap = candidateIds.some((toolId) =>
        accessibleToolIdSet.has(toolId),
      );
      if (hasOverlap) {
        available.push(agent);
      }
    }
    return available;
  }

  async findOne(id: number) {
    return this.findOneWithTools(id);
  }

  async update(id: number, dto: UpdateAgentDto) {
    const existing = await this.findOneWithTools(id);
    await this.prisma.agent.update({
      where: { id },
      data: {
        appClientId: dto.appClientId,
        name: dto.name,
        description: dto.description,
        systemPrompt: dto.systemPrompt,
        maxSteps: dto.maxSteps,
        enableToolCall: dto.enableToolCall,
        restrictTools: dto.restrictTools,
        restrictHostTools: dto.restrictHostTools,
        restrictSkills: dto.restrictSkills,
        config: dto.config as Prisma.InputJsonValue | undefined,
      },
    });
    if (dto.toolIds) {
      await this.prisma.$transaction([
        this.prisma.agentTool.deleteMany({ where: { agentId: id } }),
        this.prisma.agentTool.createMany({
          data: dto.toolIds.map((toolId) => ({
            agentId: id,
            toolId,
          })),
          skipDuplicates: true,
        }),
      ]);
      if (dto.restrictTools === undefined) {
        await this.prisma.agent.update({
          where: { id },
          data: { restrictTools: dto.toolIds.length > 0 },
        });
      }
    }
    await this.invalidateRuntimeCache(existing.appClientId, id);
    await this.runtimeCacheInvalidator.invalidateForAgent({
      agentId: id,
      appClientId: existing.appClientId,
    });
    if (
      dto.appClientId != null &&
      dto.appClientId !== existing.appClientId
    ) {
      await this.invalidateRuntimeCache(dto.appClientId, id);
    }
    return this.findOneWithTools(id);
  }

  async remove(id: number) {
    const row = await this.findOneWithTools(id);
    await this.runtimeCacheInvalidator.invalidateForAgent({
      agentId: id,
      appClientId: row.appClientId,
    });
    await this.prisma.agent.delete({ where: { id } });
    await this.invalidateRuntimeCache(row.appClientId, id);
    return row;
  }

  private async findOneWithTools(id: number) {
    const row = await this.prisma.agent.findUnique({
      where: { id },
      include: AGENT_WITH_TOOLS_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException(`agent ${id} not found`);
    }
    return toAgentWithToolsResponse(row);
  }

  async getToolsForAgent(
    agentId: number,
    appClientId: number,
    query: QueryAgentToolsDto,
  ): Promise<AgentToolsPageResponse> {
    await this.assertAgentInAppClient(agentId, appClientId);
    const { page, pageSize, skip, take } = resolvePagination(
      query.page,
      query.pageSize,
    );
    const { orderBy, order } = query.resolveOrder();
    const where = buildAgentToolBindingsWhere(agentId, appClientId, query);
    const orderByClause = buildAgentToolBindingsOrderBy(orderBy, order);
    const [bindings, total] = await this.prisma.$transaction([
      this.prisma.agentTool.findMany({
        where,
        orderBy: orderByClause,
        skip,
        take,
        include: {
          tool: { select: AGENT_LINKED_TOOL_SELECT },
        },
      }),
      this.prisma.agentTool.count({ where }),
    ]);
    const items = toAgentToolBindingItemList(bindings);
    return {
      agentId,
      appClientId,
      ...toPaginatedResult(items, total, page, pageSize),
    };
  }

  async addToolsToAgent(
    agentId: number,
    appClientId: number,
    dto: BindAgentToolsDto,
  ): Promise<AgentToolsBindingResponse> {
    await this.assertAgentInAppClient(agentId, appClientId);
    const uniqueToolIds = [...new Set(dto.toolIds)];
    await this.assertToolsBelongToAppClient(uniqueToolIds, appClientId);
    await this.prisma.agentTool.createMany({
      data: uniqueToolIds.map((toolId) => ({
        agentId,
        toolId,
      })),
      skipDuplicates: true,
    });
    await this.runtimeCacheInvalidator.invalidateForAgent({
      agentId,
      appClientId,
    });
    const bindings = await this.findAgentToolBindings(agentId, appClientId);
    return toAgentToolsBindingResponse(agentId, appClientId, bindings);
  }

  async removeToolsFromAgent(
    agentId: number,
    appClientId: number,
    dto: BindAgentToolsDto,
  ): Promise<AgentToolsBindingResponse> {
    await this.assertAgentInAppClient(agentId, appClientId);
    const uniqueToolIds = [...new Set(dto.toolIds)];
    await this.assertToolsBelongToAppClient(uniqueToolIds, appClientId);
    await this.prisma.$transaction([
      this.prisma.skillTool.deleteMany({
        where: {
          toolId: { in: uniqueToolIds },
          skill: { appClientId },
        },
      }),
      this.prisma.agentTool.deleteMany({
        where: {
          agentId,
          toolId: { in: uniqueToolIds },
          tool: { appClientId },
        },
      }),
    ]);
    await this.runtimeCacheInvalidator.invalidateForAgent({
      agentId,
      appClientId,
    });
    const bindings = await this.findAgentToolBindings(agentId, appClientId);
    return toAgentToolsBindingResponse(agentId, appClientId, bindings);
  }

  async getAllowedTools(
    agentId: number,
    userId: number,
    appClientId: number,
  ) {
    this.logger.debug(
      `getAllowedTools start agentId=${agentId} userId=${userId} appClientId=${appClientId}`,
    );
    const filtered = await this.agentToolCatalogService.resolveAllowedTools(
      agentId,
      userId,
      appClientId,
    );
    this.logger.debug(
      `getAllowedTools list ${JSON.stringify(
        filtered.map((tool) => ({
          id: tool.id,
          name: tool.name,
          definitionKey: tool.definitionKey,
          method: tool.method,
          path: tool.path,
        })),
      )}`,
    );
    this.logger.debug(
      `getAllowedTools result allowed=${filtered.length} appClientId=${appClientId}`,
    );
    return filtered;
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
    return {
      roleId: userApp.roleId,
      maxLevel: resolveMaxToolLevel([userApp.role.allowToolLevel]),
      roleToolIds: userApp.role.roleTools.map((row) => row.toolId),
    };
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

  private async assertAgentInAppClient(
    agentId: number,
    appClientId: number,
  ): Promise<void> {
    await this.assertAppClientExists(appClientId);
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, appClientId },
      select: { id: true },
    });
    if (!agent) {
      throw new NotFoundException(
        `agent ${agentId} not found under appClient ${appClientId}`,
      );
    }
  }

  private async assertToolsBelongToAppClient(
    toolIds: number[],
    appClientId: number,
  ): Promise<void> {
    const rows = await this.prisma.tool.findMany({
      where: { id: { in: toolIds }, appClientId },
      select: { id: true },
    });
    if (rows.length !== toolIds.length) {
      const found = new Set(rows.map((r) => r.id));
      const missing = toolIds.filter((id) => !found.has(id));
      throw new BadRequestException(
        `tool id(s) not found for appClient ${appClientId}: ${missing.join(', ')}`,
      );
    }
  }

  private findAgentToolBindings(agentId: number, appClientId: number) {
    return this.prisma.agentTool.findMany({
      where: buildAgentToolBindingsWhere(agentId, appClientId, {}),
      orderBy: { toolId: 'asc' },
      include: {
        tool: { select: AGENT_LINKED_TOOL_SELECT },
      },
    });
  }
}
