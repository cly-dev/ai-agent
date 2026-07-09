import type { Prisma } from '../../../../generated/prisma/client';
import type { QuerySkillDto, SkillOrderByField } from '../dto/query-skill.dto';
export declare function buildSkillFilterFields(query: Pick<QuerySkillDto, 'id' | 'isActive' | 'riskLevel' | 'name' | 'capabilityKey' | 'keyword'>): Prisma.SkillWhereInput;
export declare function buildSkillOrderBy(orderBy?: SkillOrderByField, order?: 'asc' | 'desc'): Prisma.SkillOrderByWithRelationInput;
export declare function buildSkillWhereForAgent(agentId: number, appClientId: number, query: Pick<QuerySkillDto, 'id' | 'isActive' | 'riskLevel' | 'name' | 'capabilityKey' | 'keyword'>): Prisma.SkillWhereInput;
export declare function buildSkillWhereForAppClient(appClientId: number, query: Pick<QuerySkillDto, 'id' | 'isActive' | 'riskLevel' | 'name' | 'capabilityKey' | 'keyword'>, agentId?: number): Prisma.SkillWhereInput;
