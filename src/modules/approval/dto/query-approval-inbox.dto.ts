import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import {
  APPROVAL_INBOX_STATUS_FILTERS,
  type ApprovalInboxStatusFilter,
} from '../../../core/approval/approval-inbox-status.util';

export { APPROVAL_INBOX_STATUS_FILTERS, type ApprovalInboxStatusFilter };

export class QueryApprovalInboxDto {
  @ApiPropertyOptional({
    enum: APPROVAL_INBOX_STATUS_FILTERS,
    default: 'pending',
    description:
      'pending=待审批（默认）；approved/rejected=已决策；decided=全部已处理；all=全部状态',
  })
  @IsOptional()
  @IsIn([...APPROVAL_INBOX_STATUS_FILTERS])
  status?: ApprovalInboxStatusFilter;

  @ApiPropertyOptional({ default: 50 })
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
