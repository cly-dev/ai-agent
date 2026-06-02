import { ApiPropertyOptional } from '@nestjs/swagger';
import { ToolLevel } from '../../../../generated/prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination';

const ROLE_ORDER_BY_FIELDS = ['id', 'name', 'allowToolLevel', 'createdAt'] as const;

export type RoleOrderByField = (typeof ROLE_ORDER_BY_FIELDS)[number];

export class QueryRoleDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '角色 ID（精确）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id?: number;

  @ApiPropertyOptional({ description: '角色名（模糊，忽略大小写）' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '关键词：匹配 name / description' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ enum: ToolLevel })
  @IsOptional()
  @IsEnum(ToolLevel)
  allowToolLevel?: ToolLevel;

  @ApiPropertyOptional({
    description: '排序字段',
    enum: ROLE_ORDER_BY_FIELDS,
    default: 'id',
  })
  @IsOptional()
  @IsIn(ROLE_ORDER_BY_FIELDS)
  orderBy?: RoleOrderByField;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}
