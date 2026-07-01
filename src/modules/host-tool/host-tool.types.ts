import type { Prisma } from '../../../generated/prisma/client';

export const HOST_PAGE_DETAIL_INCLUDE = {
  appClient: { select: { id: true, name: true, dsn: true } },
  _count: { select: { hostTools: true } },
} satisfies Prisma.HostPageInclude;

export const HOST_TOOL_DETAIL_INCLUDE = {
  appClient: { select: { id: true, name: true, dsn: true } },
  hostPage: { select: { id: true, scope: true, label: true } },
} satisfies Prisma.HostToolInclude;

export type HostPageDetailRow = Prisma.HostPageGetPayload<{
  include: typeof HOST_PAGE_DETAIL_INCLUDE;
}>;

export type HostToolDetailRow = Prisma.HostToolGetPayload<{
  include: typeof HOST_TOOL_DETAIL_INCLUDE;
}>;

export type HostPageResponse = {
  id: number;
  appClientId: number;
  appClientName?: string;
  scope: string;
  label: string;
  description: string | null;
  routePattern: string | null;
  sortOrder: number;
  isActive: boolean;
  hostToolCount?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type HostToolResponse = {
  id: number;
  appClientId: number;
  appClientName?: string;
  hostPageId: number | null;
  pageScope: string | null;
  pageLabel: string | null;
  definitionKey: string;
  name: string;
  description: string;
  argsSchema: unknown;
  argsTemplate: unknown | null;
  sortOrder: number;
  isActive: boolean;
  config: unknown | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ClientHostToolCatalogItem = {
  id: number;
  name: string;
  description: string;
  argsSchema: unknown;
  pageScope: string | null;
  definitionKey: string;
};

/** AgentHostTool 中间表 + HostTool 详情（与 HTTP AgentTool 对称）。 */
export type AgentHostToolBindingResponse = {
  id: number;
  agentId: number;
  hostToolId: number;
  hostTool: HostToolResponse;
};

/** SkillHostTool 中间表 + HostTool 详情。 */
export type SkillHostToolBindingResponse = {
  id: number;
  skillId: number;
  hostToolId: number;
  trigger: string;
  priority: number;
  isRequired: boolean;
  skillArgsTemplate: unknown | null;
  hostTool: HostToolResponse;
};

export type AgentHostToolsBindingResponse = {
  agentId: number;
  appClientId: number;
  hostTools: HostToolResponse[];
  agentHostTools: AgentHostToolBindingResponse[];
};

export type SkillHostToolsBindingResponse = {
  skillId: number;
  appClientId: number;
  hostTools: HostToolResponse[];
  skillHostTools: SkillHostToolBindingResponse[];
};
