import { AgentRunStatus } from '../../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/pagination';
declare const MESSAGE_TURN_ORDER_BY_FIELDS: readonly ["id", "createdAt", "updatedAt", "startedAt", "finishedAt", "durationMs", "totalTokens"];
export type MessageTurnOrderByField = (typeof MESSAGE_TURN_ORDER_BY_FIELDS)[number];
export declare class QueryMessageTurnDto extends PaginationQueryDto {
    id?: number;
    messageId?: number;
    sessionId?: string;
    userId?: number;
    appClientId?: number;
    primaryAgentId?: number;
    status?: AgentRunStatus;
    userInput?: string;
    keyword?: string;
    minLowQualityCount?: number;
    orderBy?: MessageTurnOrderByField;
    order?: 'asc' | 'desc';
}
export { MESSAGE_TURN_ORDER_BY_FIELDS };
