import type { PrismaService } from '../../prisma/prisma.service';
import {
  resolveAgentHostToolCandidateIds,
  resolveAgentToolCandidateIds,
} from './capability-candidate.util';

export async function loadAgentToolCandidateIds(
  prisma: PrismaService,
  appClientId: number,
  agentId: number,
): Promise<number[]> {
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, appClientId },
    select: { restrictTools: true },
  });
  if (!agent) {
    return [];
  }
  const [bindings, appActive] = await Promise.all([
    prisma.agentTool.findMany({
      where: { agentId },
      select: { toolId: true },
      orderBy: { toolId: 'asc' },
    }),
    prisma.tool.findMany({
      where: { appClientId, isActive: true },
      select: { id: true },
      orderBy: { id: 'asc' },
    }),
  ]);
  return resolveAgentToolCandidateIds({
    restrictTools: agent.restrictTools,
    whitelistIds: bindings.map((row) => row.toolId),
    appActiveIds: appActive.map((row) => row.id),
  });
}

export async function loadAgentHostToolCandidateIds(
  prisma: PrismaService,
  appClientId: number,
  agentId: number,
): Promise<number[]> {
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, appClientId },
    select: { restrictHostTools: true },
  });
  if (!agent) {
    return [];
  }
  const [bindings, appActive] = await Promise.all([
    prisma.agentHostTool.findMany({
      where: { agentId },
      select: { hostToolId: true },
      orderBy: { hostToolId: 'asc' },
    }),
    prisma.hostTool.findMany({
      where: { appClientId, isActive: true },
      select: { id: true },
      orderBy: { id: 'asc' },
    }),
  ]);
  return resolveAgentHostToolCandidateIds({
    restrictHostTools: agent.restrictHostTools,
    whitelistIds: bindings.map((row) => row.hostToolId),
    appActiveIds: appActive.map((row) => row.id),
  });
}

export async function loadAgentSkillVisibilityContext(
  prisma: PrismaService,
  appClientId: number,
  agentId: number,
): Promise<{
  restrictSkills: boolean;
  skillWhitelistIds: number[];
}> {
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, appClientId },
    select: { restrictSkills: true },
  });
  if (!agent) {
    return { restrictSkills: true, skillWhitelistIds: [] };
  }
  const bindings = await prisma.agentSkill.findMany({
    where: { agentId },
    select: { skillId: true },
    orderBy: { skillId: 'asc' },
  });
  return {
    restrictSkills: agent.restrictSkills,
    skillWhitelistIds: bindings.map((row) => row.skillId),
  };
}
