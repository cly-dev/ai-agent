import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const MESSAGE_ROLES = ['user', 'assistant', 'tool', 'system'] as const;

export class CreateChatDto {
  @ApiPropertyOptional({ description: '会话标题' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({ description: '关联 Agent ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  agentId?: number;

  @ApiProperty({
    description: '第一条消息角色',
    enum: MESSAGE_ROLES,
    example: 'user',
  })
  @IsString()
  @IsIn([...MESSAGE_ROLES])
  role!: string;

  @ApiProperty({ description: '第一条消息文本内容' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1_000_000)
  content!: string;

  @ApiPropertyOptional({ description: '第一条消息工具调用名称' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  toolName?: string | null;

  @ApiPropertyOptional({ description: '第一条消息工具入参 JSON' })
  @IsOptional()
  @IsObject()
  toolInput?: Record<string, unknown>;

  @ApiPropertyOptional({ description: '第一条消息工具出参 JSON' })
  @IsOptional()
  @IsObject()
  toolOutput?: Record<string, unknown>;
}
