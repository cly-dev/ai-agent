import type { Prisma } from '../../../../generated/prisma/client';
import { resolveSortOrder } from '../../../common/pagination';
import type { QuerySkillDto, SkillOrderByField } from '../dto/query-skill.dto';

export function buildSkillFilterFields(
  query: Pick<
    QuerySkillDto,
    'id' | 'isActive' | 'riskLevel' | 'name' | 'capabilityKey' | 'keyword'
  >,
): Prisma.SkillWhereInput {
  const where: Prisma.SkillWhereInput = {};
  if (query.id != null) {
    where.id = query.id;
  }
  if (query.isActive != null) {
    where.isActive = query.isActive;
  }
  if (query.riskLevel != null) {
    where.riskLevel = query.riskLevel;
  }
  if (query.name?.trim()) {
    where.name = { contains: query.name.trim(), mode: 'insensitive' };
  }
  if (query.capabilityKey?.trim()) {
    where.capabilityKey = {
      contains: query.capabilityKey.trim(),
      mode: 'insensitive',
    };
  }
  if (query.keyword?.trim()) {
    const keyword = query.keyword.trim();
    where.OR = [
      { name: { contains: keyword, mode: 'insensitive' } },
      { description: { contains: keyword, mode: 'insensitive' } },
      { capabilityKey: { contains: keyword, mode: 'insensitive' } },
    ];
  }
  return where;
}

export function buildSkillOrderBy(
  orderBy?: SkillOrderByField,
  order?: 'asc' | 'desc',
): Prisma.SkillOrderByWithRelationInput {
  const direction = resolveSortOrder(order);
  switch (orderBy ?? 'createdAt') {
    case 'id':
      return { id: direction };
    case 'name':
      return { name: direction };
    case 'capabilityKey':
      return { capabilityKey: direction };
    case 'isActive':
      return { isActive: direction };
    case 'riskLevel':
      return { riskLevel: direction };
    case 'updatedAt':
      return { updatedAt: direction };
    case 'createdAt':
    default:
      return { createdAt: direction };
  }
}

export function buildSkillWhereForAgent(
  agentId: number,
  query: Pick<
    QuerySkillDto,
    'id' | 'isActive' | 'riskLevel' | 'name' | 'capabilityKey' | 'keyword'
  >,
): Prisma.SkillWhereInput {
  return {
    agentId,
    ...buildSkillFilterFields(query),
  };
}
