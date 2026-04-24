import { Injectable, NotFoundException } from '@nestjs/common';
import { ToolLevel } from '../../../generated/prisma/client';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAgentDto) {
    return this.prisma.agent.create({
      data: {
        appClientId: dto.appClientId,
        name: dto.name,
        description: dto.description ?? null,
        systemPrompt: dto.systemPrompt,
        toolIds: dto.toolIds ?? [],
        maxSteps: dto.maxSteps ?? 8,
        enableToolCall: dto.enableToolCall ?? true,
        config: dto.config as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async findAll() {
    return this.prisma.agent.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: number) {
    const row = await this.prisma.agent.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`agent ${id} not found`);
    }
    return row;
  }

  async update(id: number, dto: UpdateAgentDto) {
    await this.findOne(id);
    return this.prisma.agent.update({
      where: { id },
      data: {
        appClientId: dto.appClientId,
        name: dto.name,
        description: dto.description,
        systemPrompt: dto.systemPrompt,
        toolIds: dto.toolIds,
        maxSteps: dto.maxSteps,
        enableToolCall: dto.enableToolCall,
        config: dto.config as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.agent.delete({ where: { id } });
  }

  async getAllowedTools(
    agentId: number,
    userId: number,
    appClientId: number,
  ) {
    const [agent, user] = await Promise.all([
      this.prisma.agent.findFirst({
        where: { id: agentId, appClientId },
        select: { toolIds: true },
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
      return [];
    }
    const roleIds = [userApp.roleId];
    const maxLevel = this.resolveMaxToolLevel([userApp.role.allowToolLevel]);
    const roleTools = await this.prisma.roleTool.findMany({
      where: { roleId: { in: roleIds } },
      select: { toolId: true },
    });
    const roleToolIds = new Set(roleTools.map((item) => item.toolId));
    const effectiveToolIds = agent.toolIds.filter((id) => roleToolIds.has(id));
    if (effectiveToolIds.length === 0) {
      return [];
    }

    const tools = await this.prisma.tool.findMany({
      where: {
        id: { in: effectiveToolIds },
        appClientId,
        riskLevel: { in: this.allowedLevels(maxLevel) },
      },
    });
    const toolById = new Map(tools.map((tool) => [tool.id, tool]));
    return effectiveToolIds
      .map((id) => toolById.get(id))
      .filter((tool) => tool !== undefined);
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
}
