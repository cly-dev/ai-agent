import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { IntegrationAuthMode } from '../../../../generated/prisma/client';

export class CreateIntegrationDto {
  @ApiProperty({ description: '所属 AppClient ID', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  appClientId!: number;

  @ApiProperty({ description: '集成名称', example: '订单中心 API' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'API 根地址', example: 'https://api.example.com' })
  @IsString()
  baseUrl!: string;

  @ApiPropertyOptional({
    description: '系统级 API Key（SYSTEM_ONLY / USER_PREFERRED 时使用）',
  })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({
    description: '集成描述（可选）',
    example: '订单系统 OpenAPI 集成',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: '鉴权模式',
    enum: IntegrationAuthMode,
    default: IntegrationAuthMode.USER_PREFERRED,
  })
  @IsOptional()
  @IsEnum(IntegrationAuthMode)
  authMode?: IntegrationAuthMode;
}
