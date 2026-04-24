import { Injectable, NotFoundException } from '@nestjs/common';
import { ToolLevel } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AgentService {
  constructor(private readonly prisma: PrismaService) {}

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
    const userAppRoles = await this.prisma.userAppRole.findMany({
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
    if (userAppRoles.length === 0) {
      return [];
    }

    const roleIds = Array.from(new Set(userAppRoles.map((item) => item.roleId)));
    const maxLevel = this.resolveMaxToolLevel(
      userAppRoles.map((item) => item.role.allowToolLevel),
    );
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
