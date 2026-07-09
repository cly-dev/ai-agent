import { ToolLevel } from '../../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/pagination';
declare const ROLE_ORDER_BY_FIELDS: readonly ["id", "name", "allowToolLevel", "createdAt"];
export type RoleOrderByField = (typeof ROLE_ORDER_BY_FIELDS)[number];
export declare class QueryRoleDto extends PaginationQueryDto {
    id?: number;
    name?: string;
    keyword?: string;
    allowToolLevel?: ToolLevel;
    orderBy?: RoleOrderByField;
    order?: 'asc' | 'desc';
}
export {};
