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
  Min,
} from 'class-validator';
import { PageContextMessageFieldsDto } from './page-context-fields.dto';

const MESSAGE_ROLES = ['user', 'assistant', 'tool', 'system'] as const;

export class CreateChatDto extends PageContextMessageFieldsDto {
  @ApiPropertyOptional({ description: '会话标题' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({
    description: '关联 Agent ID（须属于同一 AppClient），默认 1',
    default: 1,
  })
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

  @ApiPropertyOptional({
    description:
      '指定 Agent Skill ID（来自 GET /agent/:agentId/skills/client）。传入后外层 Plan 固定进入该 Skill。',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  skillId?: number;
}
