import type { RoleResponse, RoleWithCounts } from './role.types';
export declare function toRoleResponse(row: RoleWithCounts): RoleResponse;
export declare function toRoleResponseList(rows: RoleWithCounts[]): RoleResponse[];
