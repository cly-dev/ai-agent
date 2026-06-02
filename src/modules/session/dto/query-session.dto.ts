import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination';

const SESSION_ORDER_BY_FIELDS = [
  'id',
  'createdAt',
  'updatedAt',
  'userId',
  'agentId',
] as const;

export type SessionOrderByField = (typeof SESSION_ORDER_BY_FIELDS)[number];

export class QuerySessionDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Session ID（精确）' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ description: '用户 ID（精确）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({ description: 'Agent ID（精确）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  agentId?: number;

  @ApiPropertyOptional({ description: '标题（模糊，忽略大小写）' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '关键词：匹配 id / title' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: '排序字段',
    enum: SESSION_ORDER_BY_FIELDS,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(SESSION_ORDER_BY_FIELDS)
  orderBy?: SessionOrderByField;

  @ApiPropertyOptional({
    description: '排序方向',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}

export { SESSION_ORDER_BY_FIELDS };
