import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { LlmModelKind } from '../../../../generated/prisma/client';

export class UpsertLlmModelConfigDto {
  @ApiProperty({ enum: LlmModelKind })
  @IsEnum(LlmModelKind)
  kind!: LlmModelKind;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiProperty()
  @IsString()
  model!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiKey?: string | null;

  @ApiProperty()
  @IsString()
  baseUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  chatPath?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  parameters?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  stream?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxTokens?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  temperature?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
