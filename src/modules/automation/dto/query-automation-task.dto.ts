import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import {
  AUTOMATION_TASK_STATUSES,
  AUTOMATION_TRIGGER_SOURCES,
  type AutomationTaskStatusFilter,
  type AutomationTriggerSourceFilter,
} from '../automation.types';

export class QueryAutomationTaskDto {
  @ApiPropertyOptional({
    enum: AUTOMATION_TASK_STATUSES,
    default: 'active',
    description:
      'active=running+awaiting_approval；all=全部终态与进行中',
  })
  @IsOptional()
  @IsIn([...AUTOMATION_TASK_STATUSES])
  status?: AutomationTaskStatusFilter;

  @ApiPropertyOptional({
    enum: AUTOMATION_TRIGGER_SOURCES,
    default: 'all',
    description: 'v1：webhook 返回空列表',
  })
  @IsOptional()
  @IsIn([...AUTOMATION_TRIGGER_SOURCES])
  triggerSource?: AutomationTriggerSourceFilter;

  @ApiPropertyOptional({ description: '仅过滤 page_action 的 actionKey' })
  @IsOptional()
  @IsString()
  actionKey?: string;

  @ApiPropertyOptional({
    description: '按编排 key 过滤（legacy workflowKey 或 flow.flowKey）',
  })
  @IsOptional()
  @IsString()
  workflowKey?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
