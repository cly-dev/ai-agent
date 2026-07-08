import type { HttpMethod, Prisma, ToolLevel } from '../../../generated/prisma/client';
export type ToolListFilterInput = {
    id?: number;
    definitionKey?: string;
    integrationId?: number;
    toolCategoryId?: number;
    toolCategoryIdIsNull?: boolean;
    name?: string;
    description?: string;
    path?: string;
    keyword?: string;
    riskLevel?: ToolLevel;
    method?: HttpMethod;
    isActive?: boolean;
};
export declare function buildToolWhereFromFilters(query: ToolListFilterInput, base?: Prisma.ToolWhereInput): Prisma.ToolWhereInput;
export declare function parseOptionalBoolean(value: unknown): boolean | undefined;
