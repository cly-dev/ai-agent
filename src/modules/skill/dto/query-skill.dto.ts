import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ToolLevel } from '../../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/pagination';

const SKILL_ORDER_BY_FIELDS = [
  'id',
  'name',
  'capabilityKey',
  'isActive',
  'riskLevel',
  'createdAt',
  'updatedAt',
] as const;

export type SkillOrderByField = (typeof SKILL_ORDER_BY_FIELDS)[number];

export class QuerySkillDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: '按 Agent 筛选（仅 GET /skill/by-app-client/:appClientId）',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  agentId?: number;

  @ApiPropertyOptional({ description: 'Skill ID（精确）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id?: number;

  @ApiPropertyOptional({ description: '名称（模糊，忽略大小写）' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '能力键（模糊，忽略大小写）' })
  @IsOptional()
  @IsString()
  capabilityKey?: string;

  @ApiPropertyOptional({ description: '关键词：匹配 name / description / capabilityKey' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '风险等级', enum: ToolLevel })
  @IsOptional()
  @IsEnum(ToolLevel)
  riskLevel?: ToolLevel;

  @ApiPropertyOptional({
    description: '排序字段',
    enum: SKILL_ORDER_BY_FIELDS,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(SKILL_ORDER_BY_FIELDS)
  orderBy?: SkillOrderByField;

  @ApiPropertyOptional({
    description: '排序方向',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}
