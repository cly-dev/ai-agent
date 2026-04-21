import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateUserModelConfigDto {
  @ApiProperty({ description: '所属用户 ID', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number;

  @ApiProperty({ description: '模型提供商', example: 'openai' })
  @IsString()
  provider!: string;

  @ApiProperty({ description: '模型名称', example: 'gpt-4o-mini' })
  @IsString()
  model!: string;

  @ApiProperty({ description: '模型访问密钥', example: 'sk-xxx' })
  @IsString()
  apiKey!: string;

  @ApiPropertyOptional({
    description: '自定义模型网关地址',
    example: 'https://api.openai.com/v1',
  })
  @IsOptional()
  @IsUrl()
  baseUrl?: string;

  @ApiPropertyOptional({ description: '采样温度', example: 0.7 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional({ description: '最大 token 数', example: 2048 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxTokens?: number;

  @ApiPropertyOptional({ description: '是否启用该配置', example: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
