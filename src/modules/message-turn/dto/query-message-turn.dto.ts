import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { AgentRunStatus } from '../../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/pagination';

const MESSAGE_TURN_ORDER_BY_FIELDS = [
  'id',
  'createdAt',
  'updatedAt',
  'startedAt',
  'finishedAt',
  'durationMs',
  'totalTokens',
] as const;

export type MessageTurnOrderByField =
  (typeof MESSAGE_TURN_ORDER_BY_FIELDS)[number];

export class QueryMessageTurnDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'MessageTurn ID（精确）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id?: number;

  @ApiPropertyOptional({ description: '触发 Message ID（精确）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  messageId?: number;

  @ApiPropertyOptional({ description: 'Session ID（精确）' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'User ID（精确）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({ description: 'AppClient ID（精确）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  appClientId?: number;

  @ApiPropertyOptional({ description: 'Primary Agent ID（精确）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  primaryAgentId?: number;

  @ApiPropertyOptional({ description: '运行状态', enum: AgentRunStatus })
  @IsOptional()
  @IsEnum(AgentRunStatus)
  status?: AgentRunStatus;

  @ApiPropertyOptional({ description: '用户输入（模糊，忽略大小写）' })
  @IsOptional()
  @IsString()
  userInput?: string;

  @ApiPropertyOptional({
    description: '关键词：匹配 userInput / finalOutput',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: '工具 low 质量最小次数（基于 toolsUsed.qualityCounts.low）',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minLowQualityCount?: number;

  @ApiPropertyOptional({
    description: '排序字段',
    enum: MESSAGE_TURN_ORDER_BY_FIELDS,
    default: 'id',
  })
  @IsOptional()
  @IsIn(MESSAGE_TURN_ORDER_BY_FIELDS)
  orderBy?: MessageTurnOrderByField;

  @ApiPropertyOptional({
    description: '排序方向',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}

export { MESSAGE_TURN_ORDER_BY_FIELDS };
