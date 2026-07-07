import { PaginationQueryDto } from '../../../common/pagination';
declare const FEEDBACK_ORDER_BY_FIELDS: readonly ["id", "createdAt", "updatedAt"];
export type MessageFeedbackAdminOrderByField = (typeof FEEDBACK_ORDER_BY_FIELDS)[number];
export declare class QueryMessageFeedbackAdminDto extends PaginationQueryDto {
    id?: number;
    rating?: 'up' | 'down';
    agentId?: number;
    userId?: number;
    sessionId?: string;
    messageId?: number;
    turnId?: number;
    reasonTag?: string;
    commentKeyword?: string;
    orderBy?: MessageFeedbackAdminOrderByField;
    order?: 'asc' | 'desc';
}
export {};
