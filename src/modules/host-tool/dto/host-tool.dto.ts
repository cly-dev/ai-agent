import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { HostToolExposure } from '../../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export class QueryHostPageDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

export class CreateHostToolDto {
  @ApiProperty({ description: 'AppClient ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  appClientId!: number;

  @ApiPropertyOptional({
    description: '页面 ID；为空表示 App 内通用工具（如 refreshEntity）',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hostPageId?: number | null;

  @ApiProperty({ description: 'App 内稳定键', example: 'refreshEntity' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  definitionKey!: string;

  @ApiProperty({ example: 'refreshEntity' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: '参数 JSON Schema' })
  @IsObject()
  argsSchema!: Record<string, unknown>;

  @ApiPropertyOptional({ enum: HostToolExposure, default: HostToolExposure.CATALOG })
  @IsOptional()
  @IsEnum(HostToolExposure)
  exposure?: HostToolExposure;

  @ApiPropertyOptional({
    description: '参数模板，支持 $entity.id / $entity.type / $page 等',
  })
  @IsOptional()
  @IsObject()
  argsTemplate?: Record<string, unknown> | null;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown> | null;
}

export class UpdateHostToolDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hostPageId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  definitionKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  argsSchema?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: HostToolExposure })
  @IsOptional()
  @IsEnum(HostToolExposure)
  exposure?: HostToolExposure;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  argsTemplate?: Record<string, unknown> | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown> | null;
}

export class QueryHostToolDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '按页面 scope 筛选' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ description: '仅通用工具（hostPageId 为空）' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  genericOnly?: boolean;

  @ApiPropertyOptional({ enum: HostToolExposure })
  @IsOptional()
  @IsEnum(HostToolExposure)
  exposure?: HostToolExposure;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

export class QueryClientHostToolDto {
  @ApiPropertyOptional({ description: '当前 pageContext.page' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ description: '按 Agent 白名单过滤' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  agentId?: number;
}

export class ClientHostToolRegisterItemDto {
  @ApiProperty({ example: 'refreshEntity' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ description: '给 LLM / 管理端看的说明' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: '参数 JSON Schema' })
  @IsObject()
  argsSchema!: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'App 内稳定键；缺省为 generic 时用 name，否则 {scope}.{name}',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  definitionKey?: string;

  @ApiPropertyOptional({
    description: 'true 表示 App 通用工具（hostPageId 为空）',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  generic?: boolean;

  @ApiPropertyOptional({
    description: '覆盖批次 scope；仅页内工具需要',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  scope?: string;

  @ApiPropertyOptional({ enum: HostToolExposure, default: HostToolExposure.ON_COMPLETE })
  @IsOptional()
  @IsEnum(HostToolExposure)
  exposure?: HostToolExposure;

  @ApiPropertyOptional({
    description: '完成通知参数模板，如 { "entityId": "$entity.id" }',
  })
  @IsOptional()
  @IsObject()
  argsTemplate?: Record<string, unknown>;
}

/** C 端：首次注册入库，同名工具已存在则跳过（幂等）。 */
export class RegisterClientHostToolsDto {
  @ApiPropertyOptional({
    description: 'pageContext.page；页内工具批次 scope',
    example: 'review-detail',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  scope?: string;

  @ApiPropertyOptional({
    description: '自动创建 HostPage 时的展示名',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  pageLabel?: string;

  @ApiPropertyOptional({ description: '自动创建 HostPage 时的路由提示' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  routePattern?: string;

  @ApiProperty({ type: [ClientHostToolRegisterItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClientHostToolRegisterItemDto)
  tools!: ClientHostToolRegisterItemDto[];
}
