import { AdminRole } from '../../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/pagination';
declare const ADMIN_USER_ORDER_BY_FIELDS: readonly ["id", "email", "username", "role", "createdAt"];
export type AdminUserOrderByField = (typeof ADMIN_USER_ORDER_BY_FIELDS)[number];
export declare class QueryAdminUserDto extends PaginationQueryDto {
    id?: number;
    keyword?: string;
    role?: AdminRole;
    isActive?: boolean;
    orderBy?: AdminUserOrderByField;
    order?: 'asc' | 'desc';
}
export {};
