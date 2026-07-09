import { AgentRunRole, AgentRunStatus } from '../../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/pagination';
declare const AGENT_RUN_ORDER_BY_FIELDS: readonly ["id", "sequence", "createdAt", "updatedAt", "startedAt", "finishedAt", "durationMs", "totalTokens"];
export type AgentRunOrderByField = (typeof AGENT_RUN_ORDER_BY_FIELDS)[number];
export declare class QueryAgentRunDto extends PaginationQueryDto {
    id?: number;
    turnId?: number;
    agentId?: number;
    sessionId?: string;
    userId?: number;
    role?: AgentRunRole;
    status?: AgentRunStatus;
    input?: string;
    keyword?: string;
    minLowQualityCount?: number;
    orderBy?: AgentRunOrderByField;
    order?: 'asc' | 'desc';
}
export { AGENT_RUN_ORDER_BY_FIELDS };
