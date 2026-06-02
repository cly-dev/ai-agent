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
import { AgentRunRole, AgentRunStatus } from '../../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/pagination';

const AGENT_RUN_ORDER_BY_FIELDS = [
  'id',
  'sequence',
  'createdAt',
  'updatedAt',
  'startedAt',
  'finishedAt',
  'durationMs',
  'totalTokens',
] as const;

export type AgentRunOrderByField = (typeof AGENT_RUN_ORDER_BY_FIELDS)[number];

export class QueryAgentRunDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'AgentRun ID（精确）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id?: number;

  @ApiPropertyOptional({ description: 'MessageTurn ID（精确）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  turnId?: number;

  @ApiPropertyOptional({ description: 'Agent ID（精确）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  agentId?: number;

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

  @ApiPropertyOptional({ description: '运行角色', enum: AgentRunRole })
  @IsOptional()
  @IsEnum(AgentRunRole)
  role?: AgentRunRole;

  @ApiPropertyOptional({ description: '运行状态', enum: AgentRunStatus })
  @IsOptional()
  @IsEnum(AgentRunStatus)
  status?: AgentRunStatus;

  @ApiPropertyOptional({ description: '输入内容（模糊，忽略大小写）' })
  @IsOptional()
  @IsString()
  input?: string;

  @ApiPropertyOptional({ description: '关键词：匹配 input / output / error' })
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
    enum: AGENT_RUN_ORDER_BY_FIELDS,
    default: 'id',
  })
  @IsOptional()
  @IsIn(AGENT_RUN_ORDER_BY_FIELDS)
  orderBy?: AgentRunOrderByField;

  @ApiPropertyOptional({
    description: '排序方向',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}

export { AGENT_RUN_ORDER_BY_FIELDS };
