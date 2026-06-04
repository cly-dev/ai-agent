import type { Prisma, ToolLevel } from '../../../generated/prisma/client';
import { AGENT_LINKED_TOOL_SELECT } from '../agent/agent.types';

export const SKILL_APP_CLIENT_SELECT = {
  id: true,
  name: true,
  dsn: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AppClientSelect;

export const SKILL_AGENT_SELECT = {
  id: true,
  appClientId: true,
  name: true,
  description: true,
  maxSteps: true,
  enableToolCall: true,
  createdAt: true,
  appClient: {
    select: SKILL_APP_CLIENT_SELECT,
  },
} satisfies Prisma.AgentSelect;

export const SKILL_DETAIL_INCLUDE = {
  agent: {
    select: SKILL_AGENT_SELECT,
  },
  skillTools: {
    orderBy: { toolId: 'asc' as const },
    include: {
      tool: {
        select: AGENT_LINKED_TOOL_SELECT,
      },
    },
  },
  _count: {
    select: {
      skillTools: true,
      roleSkills: true,
    },
  },
} satisfies Prisma.SkillInclude;

export type SkillDetailRow = Prisma.SkillGetPayload<{
  include: typeof SKILL_DETAIL_INCLUDE;
}>;

export type SkillToolBindingResponse = {
  id: number;
  toolId: number;
  isRequired: boolean;
  requiresWriteConfirmation: boolean;
  tool: Prisma.ToolGetPayload<{
    select: typeof AGENT_LINKED_TOOL_SELECT;
  }>;
};

export type SkillAppClientSummary = Prisma.AppClientGetPayload<{
  select: typeof SKILL_APP_CLIENT_SELECT;
}>;

export type SkillAgentSummary = Omit<
  Prisma.AgentGetPayload<{
    select: typeof SKILL_AGENT_SELECT;
  }>,
  'appClient'
>;

export type SkillResponse = {
  id: number;
  agentId: number;
  /** 与 agent.appClientId 相同，便于列表筛选与写接口 */
  appClientId: number;
  /** 所属项目展示名，前端列表用此字段代替 appClientId */
  appClientName: string;
  /** 所属 Agent 展示名 */
  agentName: string;
  name: string;
  capabilityKey: string | null;
  description: string | null;
  prompt: string;
  riskLevel: ToolLevel;
  /** L2/L3 时运行前需用户确认（与 Tool 写操作规则一致） */
  requiresWriteConfirmation: boolean;
  config: unknown;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  agent: SkillAgentSummary;
  appClient: SkillAppClientSummary;
  skillTools: SkillToolBindingResponse[];
  toolCount: number;
  roleSkillCount: number;
};
