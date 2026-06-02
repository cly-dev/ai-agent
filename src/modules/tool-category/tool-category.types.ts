import type { Prisma } from '../../../generated/prisma/client';

export const TOOL_CATEGORY_DETAIL_INCLUDE = {
  _count: {
    select: {
      tools: true,
    },
  },
} satisfies Prisma.ToolCategoryInclude;

export type ToolCategoryDetailRow = Prisma.ToolCategoryGetPayload<{
  include: typeof TOOL_CATEGORY_DETAIL_INCLUDE;
}>;

export type ToolCategoryResponse = ToolCategoryDetailRow & {
  toolCount: number;
};
