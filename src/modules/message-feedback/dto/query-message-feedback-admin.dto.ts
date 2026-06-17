import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination';

const FEEDBACK_ORDER_BY_FIELDS = ['id', 'createdAt', 'updatedAt'] as const;

export type MessageFeedbackAdminOrderByField =
  (typeof FEEDBACK_ORDER_BY_FIELDS)[number];

export class QueryMessageFeedbackAdminDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '反馈 ID（精确）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id?: number;

  @ApiPropertyOptional({ description: '评价值', enum: ['up', 'down'] })
  @IsOptional()
  @IsIn(['up', 'down'])
  rating?: 'up' | 'down';

  @ApiPropertyOptional({ description: 'Agent ID（快照字段）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  agentId?: number;

  @ApiPropertyOptional({ description: '用户 ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({ description: 'Session ID' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Assistant Message ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  messageId?: number;

  @ApiPropertyOptional({ description: 'MessageTurn ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  turnId?: number;

  @ApiPropertyOptional({
    description: '点踩原因标签 key（见 down-reason-tags）',
    example: 'misunderstood',
  })
  @IsOptional()
  @IsString()
  reasonTag?: string;

  @ApiPropertyOptional({ description: '补充说明关键词（模糊）' })
  @IsOptional()
  @IsString()
  commentKeyword?: string;

  @ApiPropertyOptional({
    description: '排序字段',
    enum: FEEDBACK_ORDER_BY_FIELDS,
    default: 'id',
  })
  @IsOptional()
  @IsIn(FEEDBACK_ORDER_BY_FIELDS)
  orderBy?: MessageFeedbackAdminOrderByField;

  @ApiPropertyOptional({
    description: '排序方向',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}
