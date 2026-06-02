import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const MESSAGE_ROLES = ['user', 'assistant', 'tool', 'system'] as const;

export class SaveMessageDto {
  @ApiPropertyOptional({
    description: '关联 Agent ID（须属于同一 AppClient），默认 1',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  agentId?: number;

  @ApiProperty({
    description: '角色',
    enum: MESSAGE_ROLES,
    example: 'user',
  })
  @IsString()
  @IsIn([...MESSAGE_ROLES])
  role!: string;

  @ApiProperty({ description: '文本内容' })
  @IsString()
  @MaxLength(1_000_000)
  content!: string;

  @ApiPropertyOptional({ description: '工具调用名称' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  toolName?: string | null;

  @ApiPropertyOptional({ description: '工具入参 JSON' })
  @IsOptional()
  @IsObject()
  toolInput?: Record<string, unknown>;

  @ApiPropertyOptional({ description: '工具出参 JSON' })
  @IsOptional()
  @IsObject()
  toolOutput?: Record<string, unknown>;
}
