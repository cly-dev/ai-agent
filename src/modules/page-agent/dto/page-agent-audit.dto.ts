import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination';

export const PAGE_AGENT_LLM_PROXY_AUDIT_STATUSES = [
  'running',
  'success',
  'failed',
] as const;

export type PageAgentLlmProxyAuditStatus =
  (typeof PAGE_AGENT_LLM_PROXY_AUDIT_STATUSES)[number];

export class QueryPageAgentLlmProxyAuditDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({ enum: PAGE_AGENT_LLM_PROXY_AUDIT_STATUSES })
  @IsOptional()
  @IsIn(PAGE_AGENT_LLM_PROXY_AUDIT_STATUSES)
  status?: PageAgentLlmProxyAuditStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  modelConfigId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  upstreamStatus?: number;
}
