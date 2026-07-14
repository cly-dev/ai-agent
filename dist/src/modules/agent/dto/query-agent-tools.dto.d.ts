import { HttpMethod, ToolLevel } from '../../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/pagination';
declare const AGENT_TOOL_ORDER_BY_FIELDS: readonly ["toolId", "id", "name", "createdAt", "updatedAt", "riskLevel", "path"];
export type AgentToolOrderByField = (typeof AGENT_TOOL_ORDER_BY_FIELDS)[number];
export declare class QueryAgentToolsDto extends PaginationQueryDto {
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
    orderBy?: AgentToolOrderByField;
    order?: 'asc' | 'desc';
    resolveOrder(): {
        orderBy: AgentToolOrderByField;
        order: 'asc' | 'desc';
    };
}
export { AGENT_TOOL_ORDER_BY_FIELDS };
