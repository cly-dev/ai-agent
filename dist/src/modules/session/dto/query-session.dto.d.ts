import { PaginationQueryDto } from '../../../common/pagination';
declare const SESSION_ORDER_BY_FIELDS: readonly ["id", "createdAt", "updatedAt", "userId", "agentId"];
export type SessionOrderByField = (typeof SESSION_ORDER_BY_FIELDS)[number];
export declare class QuerySessionDto extends PaginationQueryDto {
    id?: string;
    userId?: number;
    agentId?: number;
    title?: string;
    keyword?: string;
    orderBy?: SessionOrderByField;
    order?: 'asc' | 'desc';
}
export { SESSION_ORDER_BY_FIELDS };
