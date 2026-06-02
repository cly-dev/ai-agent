import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { AgentRunRole, AgentRunStatus } from '../../../../generated/prisma/client';

export class UpdateAgentRunDto {
  @ApiPropertyOptional({ description: '关联 MessageTurn ID（可选）', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  turnId?: number | null;

  @ApiPropertyOptional({ description: 'Agent ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  agentId?: number;

  @ApiPropertyOptional({ description: 'Session ID', example: 'sess_abc123' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'User ID（可选）', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number | null;

  @ApiPropertyOptional({ description: '运行角色', enum: AgentRunRole })
  @IsOptional()
  @IsEnum(AgentRunRole)
  role?: AgentRunRole;

  @ApiPropertyOptional({ description: '同一 turn 下执行序号', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sequence?: number;

  @ApiPropertyOptional({ description: '父 run ID（可选）', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parentRunId?: number | null;

  @ApiPropertyOptional({ description: '输入内容' })
  @IsOptional()
  @IsString()
  input?: string;

  @ApiPropertyOptional({ description: '输出内容' })
  @IsOptional()
  @IsString()
  output?: string | null;

  @ApiPropertyOptional({ description: '运行状态', enum: AgentRunStatus })
  @IsOptional()
  @IsEnum(AgentRunStatus)
  status?: AgentRunStatus;

  @ApiPropertyOptional({ description: '执行步骤 JSON', example: [] })
  @IsOptional()
  @IsObject()
  steps?: Record<string, unknown> | unknown[];

  @ApiPropertyOptional({ description: '当前步数', example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  currentStep?: number;

  @ApiPropertyOptional({ description: '最大步数', example: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxSteps?: number;

  @ApiPropertyOptional({ description: '错误信息' })
  @IsOptional()
  @IsString()
  error?: string | null;

  @ApiPropertyOptional({ description: '结束原因' })
  @IsOptional()
  @IsString()
  finishReason?: string | null;
}
