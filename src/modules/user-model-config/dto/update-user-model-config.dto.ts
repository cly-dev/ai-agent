import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateUserModelConfigDto {
  @ApiPropertyOptional({ description: '模型提供商', example: 'openai' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ description: '模型名称', example: 'gpt-4o' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: '模型访问密钥', example: 'sk-updated' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({
    description: '自定义模型网关地址，可传 null 清空',
    example: 'https://api.openai.com/v1',
    nullable: true,
  })
  @IsOptional()
  @IsUrl()
  baseUrl?: string | null;

  @ApiPropertyOptional({
    description: '采样温度，可传 null 清空',
    example: 0.2,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  temperature?: number | null;

  @ApiPropertyOptional({
    description: '最大 token 数，可传 null 清空',
    example: 4096,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxTokens?: number | null;

  @ApiPropertyOptional({ description: '是否启用该配置', example: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
