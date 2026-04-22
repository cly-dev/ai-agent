import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AgentService {
  private readonly toolLevelWeight: Record<'L1' | 'L2' | 'L3', number> = {
    L1: 1,
    L2: 2,
    L3: 3,
  };

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
        include: {
          role: {
            include: {
              roleSkills: true,
            },
          },
        },
      }),
    ]);

    if (!agent) {
      throw new NotFoundException(`agent ${agentId} not found`);
    }
    if (!user) {
      throw new NotFoundException(`user ${userId} not found`);
    }
    if (!user.role) {
      return [];
    }

    const allowedSkillIds = new Set(
      user.role.roleSkills.map((roleSkill) => roleSkill.skillId),
    );
    const toolMap = new Map<number, unknown>();
    const maxAllowedLevel = this.toolLevelWeight[user.role.allowToolLevel];

    for (const agentSkill of agent.agentSkills) {
      if (!allowedSkillIds.has(agentSkill.skillId)) {
        continue;
      }

      for (const skillTool of agentSkill.skill.skillTools) {
        const toolLevel = this.toolLevelWeight[skillTool.tool.riskLevel];
        if (toolLevel > maxAllowedLevel) {
          continue;
        }
        toolMap.set(skillTool.tool.id, skillTool.tool);
      }
    }

    return Array.from(toolMap.values());
  }
}
