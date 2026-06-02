import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { IntegrationAuthMode } from '../../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/pagination';

const INTEGRATION_ORDER_BY_FIELDS = [
  'id',
  'name',
  'createdAt',
  'updatedAt',
  'baseUrl',
] as const;

export type IntegrationOrderByField =
  (typeof INTEGRATION_ORDER_BY_FIELDS)[number];

export class QueryIntegrationDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Integration ID（精确）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id?: number;

  @ApiPropertyOptional({ description: 'AppClient ID（精确）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  appClientId?: number;

  @ApiPropertyOptional({ description: '名称（模糊，忽略大小写）' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'baseUrl（模糊，忽略大小写）' })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiPropertyOptional({
    description: '关键词：匹配 name / baseUrl / description',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '鉴权模式', enum: IntegrationAuthMode })
  @IsOptional()
  @IsEnum(IntegrationAuthMode)
  authMode?: IntegrationAuthMode;

  @ApiPropertyOptional({
    description: '排序字段',
    enum: INTEGRATION_ORDER_BY_FIELDS,
    default: 'id',
  })
  @IsOptional()
  @IsIn(INTEGRATION_ORDER_BY_FIELDS)
  orderBy?: IntegrationOrderByField;

  @ApiPropertyOptional({
    description: '排序方向',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}

export { INTEGRATION_ORDER_BY_FIELDS };
