import type { Prisma } from '../../../../generated/prisma/client';
import type { PaginatedResult } from '../../../common/pagination';
import { HOST_TOOL_DETAIL_INCLUDE } from '../../host-tool/host-tool.types';
import type {
  AgentHostToolBindingResponse,
  HostToolResponse,
} from '../../host-tool/host-tool.types';

/** Agent 关联 Tool 摘要（不含 schema 等大字段，避免列表过重） */
export const AGENT_LINKED_TOOL_SELECT = {
  id: true,
  appClientId: true,
  definitionKey: true,
  name: true,
  description: true,
  riskLevel: true,
  method: true,
  path: true,
  integrationId: true,
  toolCategoryId: true,
  isActive: true,
  agentMetadata: true,
  timeout: true,
  createdAt: true,
  updatedAt: true,
  toolCategory: true,
  integration: {
    select: {
      id: true,
      name: true,
      baseUrl: true,
      authMode: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.ToolSelect;

export const AGENT_TOOLS_INCLUDE_FRAGMENT = {
  agentTools: {
    orderBy: { toolId: 'asc' },
    include: {
      tool: {
        select: AGENT_LINKED_TOOL_SELECT,
      },
    },
  },
} satisfies Prisma.AgentInclude;

/** 列表：HTTP 工具 + Host Tool 计数，不含 Host Tool 详情。 */
export const AGENT_LIST_INCLUDE = {
  ...AGENT_TOOLS_INCLUDE_FRAGMENT,
  _count: {
    select: { agentHostTools: true },
  },
} satisfies Prisma.AgentInclude;

/** 详情：含完整 Host Tool 绑定。 */
export const AGENT_WITH_TOOLS_INCLUDE = {
  ...AGENT_TOOLS_INCLUDE_FRAGMENT,
  agentHostTools: {
    orderBy: { id: 'asc' },
    include: {
      hostTool: { include: HOST_TOOL_DETAIL_INCLUDE },
    },
  },
} satisfies Prisma.AgentInclude;

export type AgentLinkedToolRow = Prisma.ToolGetPayload<{
  select: typeof AGENT_LINKED_TOOL_SELECT;
}>;

export type AgentLinkedToolResponse = AgentLinkedToolRow & {
  tags: string[];
};

export type AgentWithToolsRow = Prisma.AgentGetPayload<{
  include: typeof AGENT_WITH_TOOLS_INCLUDE;
}>;

export type AgentListRow = Prisma.AgentGetPayload<{
  include: typeof AGENT_LIST_INCLUDE;
}>;

export type AgentToolBindingItem = {
  id: number;
  agentId: number;
  toolId: number;
  tool: AgentLinkedToolResponse;
};

export type AgentToolsBindingResponse = {
  agentId: number;
  appClientId: number;
  tools: AgentLinkedToolResponse[];
  agentTools: AgentToolBindingItem[];
};

export type AgentToolsPageResponse = {
  agentId: number;
  appClientId: number;
} & PaginatedResult<AgentToolBindingItem>;

export type AgentWithToolsResponse = Omit<
  AgentWithToolsRow,
  'agentTools' | 'agentHostTools'
> & {
  /** 扁平 HTTP 工具列表，便于前端直接使用 */
  tools: AgentLinkedToolResponse[];
  /** HTTP 工具中间表 + 嵌套 tool */
  agentTools: AgentToolBindingItem[];
  /** 扁平 Host Tool 列表（详情接口；列表为空数组） */
  hostTools: HostToolResponse[];
  /** Host Tool 中间表（详情接口；列表为空数组） */
  agentHostTools: AgentHostToolBindingResponse[];
  /** 已绑 Host Tool 数量（列表用 _count；详情等于 agentHostTools.length） */
  hostToolCount: number;
};

/** C 端 Agent 列表项（仅展示基础信息） */
export type AgentClientListItem = {
  id: number;
  name: string;
  description: string | null;
};
