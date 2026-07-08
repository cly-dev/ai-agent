import { HttpMethod, ToolLevel } from '../../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/pagination';
declare const TOOL_ORDER_BY_FIELDS: readonly ["id", "name", "createdAt", "updatedAt", "riskLevel", "path"];
export type ToolOrderByField = (typeof TOOL_ORDER_BY_FIELDS)[number];
export declare class QueryToolDto extends PaginationQueryDto {
    id?: number;
    appClientId?: number;
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
    orderBy?: ToolOrderByField;
    order?: 'asc' | 'desc';
}
export { TOOL_ORDER_BY_FIELDS };
