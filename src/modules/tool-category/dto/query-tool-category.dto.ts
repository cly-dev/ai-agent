import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination';

const TOOL_CATEGORY_ORDER_BY_FIELDS = [
  'id',
  'label',
  'sortOrder',
  'createdAt',
  'updatedAt',
] as const;

export type ToolCategoryOrderByField =
  (typeof TOOL_CATEGORY_ORDER_BY_FIELDS)[number];

export class QueryToolCategoryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '分类 ID（精确）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id?: number;

  @ApiPropertyOptional({ description: '分类标签（模糊，忽略大小写）' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ description: '关键词：匹配 label / description' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: '排序字段',
    enum: TOOL_CATEGORY_ORDER_BY_FIELDS,
    default: 'sortOrder',
  })
  @IsOptional()
  @IsIn(TOOL_CATEGORY_ORDER_BY_FIELDS)
  orderBy?: ToolCategoryOrderByField;

  @ApiPropertyOptional({
    description: '排序方向',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}
