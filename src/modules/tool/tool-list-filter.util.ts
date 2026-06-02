import type { HttpMethod, Prisma, ToolLevel } from '../../../generated/prisma/client';

/** Tool 列表 / Agent 绑定 Tool 列表共用的筛选字段 */
export type ToolListFilterInput = {
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
};

export function buildToolWhereFromFilters(
  query: ToolListFilterInput,
  base: Prisma.ToolWhereInput = {},
): Prisma.ToolWhereInput {
  const where: Prisma.ToolWhereInput = { ...base };
  if (query.id != null) {
    where.id = query.id;
  }
  if (query.definitionKey?.trim()) {
    where.definitionKey = query.definitionKey.trim();
  }
  if (query.integrationId != null) {
    where.integrationId = query.integrationId;
  }
  if (query.toolCategoryIdIsNull === true) {
    where.toolCategoryId = null;
  } else if (query.toolCategoryId != null) {
    where.toolCategoryId = query.toolCategoryId;
  }
  if (query.name?.trim()) {
    where.name = { contains: query.name.trim(), mode: 'insensitive' };
  }
  if (query.description?.trim()) {
    where.description = {
      contains: query.description.trim(),
      mode: 'insensitive',
    };
  }
  if (query.path?.trim()) {
    where.path = { contains: query.path.trim(), mode: 'insensitive' };
  }
  if (query.keyword?.trim()) {
    const keyword = query.keyword.trim();
    where.OR = [
      { name: { contains: keyword, mode: 'insensitive' } },
      { description: { contains: keyword, mode: 'insensitive' } },
      { path: { contains: keyword, mode: 'insensitive' } },
    ];
  }
  if (query.riskLevel != null) {
    where.riskLevel = query.riskLevel;
  }
  if (query.method != null) {
    where.method = query.method;
  }
  if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  }
  return where;
}

export function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  return undefined;
}
