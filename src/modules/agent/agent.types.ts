import type { Prisma } from '../../../generated/prisma/client';
import type { PaginatedResult } from '../../common/pagination';

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
    },
  },
} satisfies Prisma.ToolSelect;

export const AGENT_WITH_TOOLS_INCLUDE = {
  agentTools: {
    orderBy: { toolId: 'asc' },
    include: {
      tool: {
        select: AGENT_LINKED_TOOL_SELECT,
      },
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

export type AgentWithToolsResponse = Omit<AgentWithToolsRow, 'agentTools'> & {
  /** 扁平工具列表，便于前端直接使用 */
  tools: AgentLinkedToolResponse[];
  /** 中间表 + 嵌套 tool，与 list-api 约定一致 */
  agentTools: AgentToolBindingItem[];
};

/** C 端 Agent 列表项（仅展示基础信息） */
export type AgentClientListItem = {
  id: number;
  name: string;
  description: string | null;
};
