import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class AgentChatPageContextDto {
  @ApiPropertyOptional({
    description: '业务页面标识，与 host_action.scope 对齐',
    example: 'review-detail',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  page?: string;

  @ApiPropertyOptional({ description: '当前路由路径' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  routePath?: string;

  @ApiPropertyOptional({
    description: '路由动态参数，如 { reviewId: "43689" }',
    example: { reviewId: '43689' },
  })
  @IsOptional()
  @IsObject()
  routeParams?: Record<string, unknown>;

  @ApiPropertyOptional({ description: '流程 ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  flowId?: number;

  @ApiPropertyOptional({ description: '程序/站点名称' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  programName?: string;

  @ApiPropertyOptional({
    description: '页面主实体，如 { type: "review", id: "123" }',
  })
  @IsOptional()
  @IsObject()
  entity?: Record<string, unknown>;

  @ApiPropertyOptional({ description: '额外小字段（Tab、筛选等）' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

/** 用户消息可附带的页面上下文字段（嵌套 + 平铺兼容 omnix-chat SDK）。 */
export class PageContextMessageFieldsDto {
  @ApiPropertyOptional({
    description: '嵌套页面上下文（推荐后端优先读取）',
    type: AgentChatPageContextDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AgentChatPageContextDto)
  pageContext?: AgentChatPageContextDto;

  @ApiPropertyOptional({ description: '平铺：page，与 pageContext.page 相同' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  page?: string;

  @ApiPropertyOptional({ description: '平铺：routePath' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  routePath?: string;

  @ApiPropertyOptional({ description: '平铺：routeParams' })
  @IsOptional()
  @IsObject()
  routeParams?: Record<string, unknown>;

  @ApiPropertyOptional({ description: '平铺：flowId' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  flowId?: number;

  @ApiPropertyOptional({ description: '平铺：programName' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  programName?: string;

  @ApiPropertyOptional({ description: '平铺：entity' })
  @IsOptional()
  @IsObject()
  entity?: Record<string, unknown>;

  @ApiPropertyOptional({ description: '平铺：metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
