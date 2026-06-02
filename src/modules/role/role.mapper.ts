import type { RoleResponse, RoleWithCounts } from './role.types';

export function toRoleResponse(row: RoleWithCounts): RoleResponse {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    allowToolLevel: row.allowToolLevel,
    createdAt: row.createdAt,
    _count: row._count,
  };
}

export function toRoleResponseList(rows: RoleWithCounts[]): RoleResponse[] {
  return rows.map(toRoleResponse);
}
