import type { Prisma } from '../../../generated/prisma/client';

export const AGENT_TOOL_CATALOG_INCLUDE = {
  integration: {
    select: {
      id: true,
      name: true,
      baseUrl: true,
      authMode: true,
      apiKey: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.ToolInclude;

/** 与 getAllowedTools 返回形状一致：完整 Tool 行 + integration（含 apiKey） */
export type AgentToolCatalogRow = Prisma.ToolGetPayload<{
  include: typeof AGENT_TOOL_CATALOG_INCLUDE;
}>;
