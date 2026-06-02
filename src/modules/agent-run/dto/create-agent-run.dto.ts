import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { AgentRunRole, AgentRunStatus } from '../../../../generated/prisma/client';

export class CreateAgentRunDto {
  @ApiPropertyOptional({ description: '关联 MessageTurn ID（可选）', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  turnId?: number;

  @ApiProperty({ description: 'Agent ID', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  agentId!: number;

  @ApiProperty({ description: 'Session ID', example: 'sess_abc123' })
  @IsString()
  sessionId!: string;

  @ApiPropertyOptional({ description: 'User ID（可选）', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({ description: '运行角色', enum: AgentRunRole, default: AgentRunRole.primary })
  @IsOptional()
  @IsEnum(AgentRunRole)
  role?: AgentRunRole;

  @ApiPropertyOptional({ description: '同一 turn 下执行序号', example: 1, default: 1 })
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
  parentRunId?: number;

  @ApiProperty({ description: '输入内容' })
  @IsString()
  input!: string;

  @ApiPropertyOptional({ description: '输出内容' })
  @IsOptional()
  @IsString()
  output?: string;

  @ApiPropertyOptional({ description: '运行状态', enum: AgentRunStatus, default: AgentRunStatus.running })
  @IsOptional()
  @IsEnum(AgentRunStatus)
  status?: AgentRunStatus;

  @ApiPropertyOptional({ description: '执行步骤 JSON', example: [] })
  @IsOptional()
  @IsObject()
  steps?: Record<string, unknown> | unknown[];

  @ApiPropertyOptional({ description: '当前步数', example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  currentStep?: number;

  @ApiProperty({ description: '最大步数', example: 8 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxSteps!: number;

  @ApiPropertyOptional({ description: '错误信息' })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiPropertyOptional({ description: '结束原因' })
  @IsOptional()
  @IsString()
  finishReason?: string;
}
