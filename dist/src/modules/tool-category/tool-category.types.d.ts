import type { Prisma } from '../../../generated/prisma/client';
export declare const TOOL_CATEGORY_DETAIL_INCLUDE: {
    _count: {
        select: {
            tools: true;
        };
    };
};
export type ToolCategoryDetailRow = Prisma.ToolCategoryGetPayload<{
    include: typeof TOOL_CATEGORY_DETAIL_INCLUDE;
}>;
export type ToolCategoryResponse = ToolCategoryDetailRow & {
    toolCount: number;
};
