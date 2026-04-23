import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const MESSAGE_ROLES = ['user', 'assistant', 'tool', 'system'] as const;

export class UpdateMessageDto {
  @ApiPropertyOptional({
    description: '角色',
    enum: MESSAGE_ROLES,
  })
  @IsOptional()
  @IsString()
  @IsIn([...MESSAGE_ROLES])
  role?: string;

  @ApiPropertyOptional({ description: '文本内容' })
  @IsOptional()
  @IsString()
  @MaxLength(1_000_000)
  content?: string | null;

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
