import type { Prisma } from '../../../../generated/prisma/client';
import { AGENT_LINKED_TOOL_SELECT } from '../../agent/types/agent.types';
import { HOST_TOOL_DETAIL_INCLUDE } from '../../host-tool/host-tool.types';
import type { SkillHostToolBindingResponse, HostToolResponse } from '../../host-tool/host-tool.types';

export const SKILL_APP_CLIENT_SELECT = {
  id: true,
  name: true,
  dsn: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AppClientSelect;

export const SKILL_TOOLS_INCLUDE_FRAGMENT = {
  skillTools: {
    orderBy: { toolId: 'asc' as const },
    include: {
      tool: {
        select: AGENT_LINKED_TOOL_SELECT,
      },
    },
  },
} satisfies Prisma.SkillInclude;

const SKILL_APP_CLIENT_INCLUDE_FRAGMENT = {
  appClient: {
    select: SKILL_APP_CLIENT_SELECT,
  },
} satisfies Prisma.SkillInclude;

const SKILL_COUNTS_INCLUDE_FRAGMENT = {
  _count: {
    select: {
      skillTools: true,
      roleSkills: true,
      skillHostTools: true,
      agentSkills: true,
    },
  },
} satisfies Prisma.SkillInclude;

/** 列表：HTTP 工具 + 计数，不含 Host Tool 详情。 */
export const SKILL_LIST_INCLUDE = {
  ...SKILL_APP_CLIENT_INCLUDE_FRAGMENT,
  ...SKILL_TOOLS_INCLUDE_FRAGMENT,
  ...SKILL_COUNTS_INCLUDE_FRAGMENT,
} satisfies Prisma.SkillInclude;

/** 详情：含完整 Host Tool 绑定。 */
export const SKILL_DETAIL_INCLUDE = {
  ...SKILL_APP_CLIENT_INCLUDE_FRAGMENT,
  ...SKILL_TOOLS_INCLUDE_FRAGMENT,
  skillHostTools: {
    orderBy: [{ priority: 'asc' as const }, { id: 'asc' as const }],
    include: {
      hostTool: { include: HOST_TOOL_DETAIL_INCLUDE },
    },
  },
  _count: {
    select: {
      skillTools: true,
      roleSkills: true,
      agentSkills: true,
    },
  },
} satisfies Prisma.SkillInclude;

export type SkillDetailRow = Prisma.SkillGetPayload<{
  include: typeof SKILL_DETAIL_INCLUDE;
}>;

export type SkillListRow = Prisma.SkillGetPayload<{
  include: typeof SKILL_LIST_INCLUDE;
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

export type SkillResponse = {
  id: number;
  appClientId: number;
  /** 所属项目展示名，前端列表用此字段代替 appClientId */
  appClientName: string;
  name: string;
  capabilityKey: string | null;
  description: string | null;
  prompt: string;
  riskLevel: import('../../../../generated/prisma/client').ToolLevel;
  /** L2/L3 时运行前需用户确认（与 Tool 写操作规则一致） */
  requiresWriteConfirmation: boolean;
  config: unknown;
  workflowId: number | null;
  workflowVersion: number | null;
  flowId: number | null;
  flowVersion: number | null;
  workflowOverrides: unknown;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  appClient: SkillAppClientSummary;
  skillTools: SkillToolBindingResponse[];
  /** 扁平 Host Tool 列表（详情接口；列表为空数组） */
  hostTools: HostToolResponse[];
  /** Host Tool 中间表（详情接口；列表为空数组） */
  skillHostTools: SkillHostToolBindingResponse[];
  toolCount: number;
  /** 已绑 Host Tool 数量 */
  hostToolCount: number;
  roleSkillCount: number;
  /** Agent 白名单绑定数（收紧模式） */
  agentSkillCount: number;
};

/** C 端 Skill 列表项（不含 prompt / config）。 */
export type SkillClientListItem = {
  id: number;
  name: string;
  description: string | null;
  capabilityKey: string | null;
  riskLevel: import('../../../../generated/prisma/client').ToolLevel;
  requiresWriteConfirmation: boolean;
  toolIds: number[];
  hostToolIds: number[];
  /** 仅当请求带 ?page= 时返回：该 Skill 的 Host Tool 是否命中当前页 scope */
  pageMatched?: boolean;
};
