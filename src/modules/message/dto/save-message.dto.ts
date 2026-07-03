import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PageContextMessageFieldsDto } from '../../chat/dto/page-context-fields.dto';
import { DraftReviewDecisionDto } from './draft-review-decision.dto';

const MESSAGE_ROLES = ['user', 'assistant', 'tool', 'system'] as const;

export class SaveMessageDto extends PageContextMessageFieldsDto {
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

  @ApiProperty({ description: '文本内容（JSON 请先 stringify）' })
  @IsString()
  @MaxLength(1_000_000)
  content!: string;

  @ApiPropertyOptional({
    description:
      'MessageTurn ID。role=assistant 时写入 outputMessageId；正常对话由 Agent run 收尾自动落库，前端一般无需传。',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  turnId?: number;

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

  @ApiPropertyOptional({
    description:
      '写确认门结构化决策（confirm / confirm_with_edits / retry / cancel）；优先于 confirmWrite / cancelWrite',
  })
  @IsOptional()
  @Type(() => DraftReviewDecisionDto)
  writeGate?: DraftReviewDecisionDto;

  @ApiPropertyOptional({
    description:
      '（已废弃）为 true 时确认并执行上一轮缓存的写操作；请改用 writeGate.action=confirm',
    deprecated: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  confirmWrite?: boolean;

  @ApiPropertyOptional({
    description:
      '（已废弃）为 true 时取消待确认写操作；请改用 writeGate.action=cancel',
    deprecated: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  cancelWrite?: boolean;

  @ApiPropertyOptional({
    description:
      '指定 Agent Skill ID（来自 GET /agent/:agentId/skills/client）。传入后外层 Plan 固定进入该 Skill，不再由 LLM 选择。',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  skillId?: number;
}
