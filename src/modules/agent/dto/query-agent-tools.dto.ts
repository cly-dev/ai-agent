import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { HttpMethod, ToolLevel } from '../../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/pagination';
import { parseOptionalBoolean } from '../../tool/tool-list-filter.util';

const AGENT_TOOL_ORDER_BY_FIELDS = [
  'toolId',
  'id',
  'name',
  'createdAt',
  'updatedAt',
  'riskLevel',
  'path',
] as const;

export type AgentToolOrderByField = (typeof AGENT_TOOL_ORDER_BY_FIELDS)[number];

export class QueryAgentToolsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Tool ID（精确）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id?: number;

  @ApiPropertyOptional({
    description: '业务能力键 definitionKey（精确）',
    example: 'order.get.api.orders',
  })
  @IsOptional()
  @IsString()
  definitionKey?: string;

  @ApiPropertyOptional({ description: 'Integration ID（精确）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  integrationId?: number;

  @ApiPropertyOptional({ description: '工具分类 ID（精确）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  toolCategoryId?: number;

  @ApiPropertyOptional({
    description: '是否未归类（toolCategoryId 为 null）',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseOptionalBoolean(value))
  @IsBoolean()
  toolCategoryIdIsNull?: boolean;

  @ApiPropertyOptional({ description: '名称（模糊，忽略大小写）' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '描述（模糊，忽略大小写）' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '路径（模糊，忽略大小写）' })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({
    description: '关键词：匹配 name / description / path',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '风险等级', enum: ToolLevel })
  @IsOptional()
  @IsEnum(ToolLevel)
  riskLevel?: ToolLevel;

  @ApiPropertyOptional({ description: 'HTTP 方法', enum: HttpMethod })
  @IsOptional()
  @IsEnum(HttpMethod)
  method?: HttpMethod;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @Transform(({ value }) => parseOptionalBoolean(value))
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: '排序字段（toolId/id 为绑定表字段，其余为 Tool 字段）',
    enum: AGENT_TOOL_ORDER_BY_FIELDS,
    default: 'toolId',
  })
  @IsOptional()
  @IsIn(AGENT_TOOL_ORDER_BY_FIELDS)
  orderBy?: AgentToolOrderByField;

  @ApiPropertyOptional({
    description: '排序方向 asc / desc',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  resolveOrder(): { orderBy: AgentToolOrderByField; order: 'asc' | 'desc' } {
    return {
      orderBy: this.orderBy ?? 'toolId',
      order: this.order?.toLowerCase() === 'desc' ? 'desc' : 'asc',
    };
  }
}

export { AGENT_TOOL_ORDER_BY_FIELDS };
