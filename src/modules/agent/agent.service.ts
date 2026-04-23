import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AgentService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllowedTools(agentId: number, userId: number) {
    const [agent, user] = await Promise.all([
      this.prisma.agent.findUnique({
        where: { id: agentId },
        include: {
          agentSkills: {
            include: {
              skill: {
                include: {
                  skillTools: {
                    include: { tool: true },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { userRole: true },
      }),
    ]);

    if (!agent) {
      throw new NotFoundException(`agent ${agentId} not found`);
    }
    if (!user) {
      throw new NotFoundException(`user ${userId} not found`);
    }
    if (!user.userRole) {
      return [];
    }

    const userRoleTools = await this.prisma.userRoleTool.findMany({
      where: { userRole: user.userRole },
      select: { toolId: true },
    });

    const allowedToolIds = new Set(userRoleTools.map((item) => item.toolId));
    const toolMap = new Map<number, unknown>();

    for (const agentSkill of agent.agentSkills) {
      for (const skillTool of agentSkill.skill.skillTools) {
        if (!allowedToolIds.has(skillTool.tool.id)) {
          continue;
        }
        toolMap.set(skillTool.tool.id, skillTool.tool);
      }
    }

    return Array.from(toolMap.values());
  }
}
