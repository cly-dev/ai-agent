import { ToolLevel } from '../../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/pagination';
declare const SKILL_ORDER_BY_FIELDS: readonly ["id", "name", "capabilityKey", "isActive", "riskLevel", "createdAt", "updatedAt"];
export type SkillOrderByField = (typeof SKILL_ORDER_BY_FIELDS)[number];
export declare class QuerySkillDto extends PaginationQueryDto {
    agentId?: number;
    id?: number;
    name?: string;
    capabilityKey?: string;
    keyword?: string;
    isActive?: boolean;
    riskLevel?: ToolLevel;
    orderBy?: SkillOrderByField;
    order?: 'asc' | 'desc';
}
export {};
