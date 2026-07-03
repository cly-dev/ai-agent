import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { DRAFT_REVIEW_ACTIONS } from '../../../core/draft-review';

export class DraftReviewDecisionDto {
  @ApiProperty({
    description: '草稿评审动作',
    enum: DRAFT_REVIEW_ACTIONS,
  })
  @IsString()
  @IsIn([...DRAFT_REVIEW_ACTIONS])
  action!: (typeof DRAFT_REVIEW_ACTIONS)[number];

  @ApiPropertyOptional({
    description: '编辑后的 MessageBlocks 序列化串',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1_000_000)
  editedPreviewSerialized?: string | null;

  @ApiPropertyOptional({
    description: '覆盖写工具 arguments（浅 merge）',
  })
  @IsOptional()
  @IsObject()
  editedPendingWriteArguments?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: '重试时的补充说明',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  retryInstruction?: string | null;
}
