import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateAgentDto {
  @ApiPropertyOptional({ description: '所属 AppClient ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  appClientId?: number;

  @ApiPropertyOptional({ description: 'Agent 名称', example: 'Sales Assistant' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '系统提示词' })
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @ApiPropertyOptional({ description: 'Agent 描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '允许调用的工具 ID 列表', type: [Number] })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  toolIds?: number[];

  @ApiPropertyOptional({ description: '最大执行步数', example: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxSteps?: number;

  @ApiPropertyOptional({ description: '是否启用工具调用', example: true })
  @IsOptional()
  @IsBoolean()
  enableToolCall?: boolean;

  @ApiPropertyOptional({
    description: '自定义配置 JSON',
    example: { temperature: 0.2 },
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
