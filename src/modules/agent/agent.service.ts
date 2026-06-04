import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ToolLevel } from '../../../generated/prisma/client';
import type { Prisma } from '../../../generated/prisma/client';
import {
  resolvePagination,
  toPaginatedResult,
} from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import {
  toAgentToolBindingItemList,
  toAgentToolsBindingResponse,
  toAgentWithToolsResponse,
  toAgentWithToolsResponseList,
} from './agent.mapper';
import {
  AGENT_LINKED_TOOL_SELECT,
  AGENT_WITH_TOOLS_INCLUDE,
  type AgentToolsBindingResponse,
  type AgentToolsPageResponse,
} from './agent.types';
import {
  buildAgentToolBindingsOrderBy,
  buildAgentToolBindingsWhere,
} from './agent-tool-query.util';
import type { QueryAgentToolsDto } from './dto/query-agent-tools.dto';
import { BindAgentToolsDto } from './dto/bind-agent-tools.dto';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { AgentCacheStore } from './agent-cache.store';
import type { AgentRuntimeSnapshot } from './agent-runtime.types';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly agentCacheStore: AgentCacheStore,
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
    const agent = await this.prisma.agent.create({
      data: {
        appClientId: dto.appClientId,
        name: dto.name,
        description: dto.description ?? null,
        systemPrompt: dto.systemPrompt,
        maxSteps: dto.maxSteps ?? 8,
        enableToolCall: dto.enableToolCall ?? true,
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
      include: AGENT_WITH_TOOLS_INCLUDE,
    });
    return toAgentWithToolsResponseList(rows);
  }

  async findByAppClientId(appClientId: number) {
    await this.assertAppClientExists(appClientId);
    return this.prisma.agent.findMany({
      where: { appClientId },
      orderBy: { id: 'asc' },
    });
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
    }
    await this.invalidateRuntimeCache(existing.appClientId, id);
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
          skill: { agentId },
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
    const [agent, user] = await Promise.all([
      this.prisma.agent.findFirst({
        where: { id: agentId, appClientId },
        select: { id: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      }),
    ]);

    if (!agent) {
      throw new NotFoundException(`agent ${agentId} not found`);
    }
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
          },
        },
      },
    });
    if (!userApp) {
      this.logger.warn(
        `getAllowedTools empty: no userApp binding userId=${userId} appClientId=${appClientId}`,
      );
      return [];
    }
    const roleIds = [userApp.roleId];
    const maxLevel = this.resolveMaxToolLevel([userApp.role.allowToolLevel]);
    const roleTools = await this.prisma.roleTool.findMany({
      where: { roleId: { in: roleIds } },
      select: { toolId: true },
    });
    const roleToolIds = new Set(roleTools.map((item) => item.toolId));
    const agentTools = await this.prisma.agentTool.findMany({
      where: { agentId: agent.id },
      select: { toolId: true },
    });
    const effectiveToolIds = agentTools
      .map((item) => item.toolId)
      .filter((id) => roleToolIds.has(id));
    this.logger.debug(
      `getAllowedTools candidate counts agentTools=${agentTools.length} roleTools=${roleTools.length} intersection=${effectiveToolIds.length} roleId=${userApp.roleId} maxLevel=${maxLevel}`,
    );
    if (effectiveToolIds.length === 0) {
      this.logger.warn(
        `getAllowedTools empty: no intersection agentId=${agentId} userId=${userId} appClientId=${appClientId}`,
      );
      return [];
    }

    const tools = await this.prisma.tool.findMany({
      where: {
        id: { in: effectiveToolIds },
        appClientId,
        riskLevel: { in: this.allowedLevels(maxLevel) },
      },
      include: {
        integration: {
          select: {
            id: true,
            name: true,
            baseUrl: true,
            authMode: true,
            apiKey: true,
          },
        },
      },
    });
    const toolById = new Map(tools.map((tool) => [tool.id, tool]));
    const filtered = effectiveToolIds
      .map((id) => toolById.get(id))
      .filter((tool) => tool !== undefined);
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
      `getAllowedTools result allowed=${filtered.length} fetched=${tools.length} appClientId=${appClientId}`,
    );
    return filtered;
  }

  private resolveMaxToolLevel(levels: ToolLevel[]): ToolLevel {
    if (levels.includes(ToolLevel.L3)) {
      return ToolLevel.L3;
    }
    if (levels.includes(ToolLevel.L2)) {
      return ToolLevel.L2;
    }
    return ToolLevel.L1;
  }

  private allowedLevels(maxLevel: ToolLevel): ToolLevel[] {
    if (maxLevel === ToolLevel.L3) {
      return [ToolLevel.L1, ToolLevel.L2, ToolLevel.L3];
    }
    if (maxLevel === ToolLevel.L2) {
      return [ToolLevel.L1, ToolLevel.L2];
    }
    return [ToolLevel.L1];
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
