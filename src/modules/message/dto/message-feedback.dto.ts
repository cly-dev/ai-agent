import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const FEEDBACK_RATINGS = ['up', 'down'] as const;

export class UpsertMessageFeedbackDto {
  @ApiProperty({ enum: FEEDBACK_RATINGS, description: '赞或踩' })
  @IsIn([...FEEDBACK_RATINGS])
  rating!: (typeof FEEDBACK_RATINGS)[number];

  @ApiPropertyOptional({
    description:
      '点踩原因标签 key 列表（见 GET /chat/feedback/down-reason-tags）；点踩时须至少选一个标签或填写 comment',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  reasonTags?: string[];

  @ApiPropertyOptional({
    description: '点踩补充说明；选 other 标签时必填',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

export class QuerySessionMessageFeedbacksDto {
  @ApiProperty({
    description: 'assistant 消息 ID 列表，逗号分隔',
    example: '12,15,18',
  })
  @IsString()
  messageIds!: string;
}
