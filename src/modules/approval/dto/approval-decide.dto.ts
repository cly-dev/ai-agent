import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { DraftReviewDecisionDto } from '../../message/dto/draft-review-decision.dto';

export class ApprovalDecideDto {
  @ApiProperty({ description: '草稿评审结构化决策' })
  @ValidateNested()
  @Type(() => DraftReviewDecisionDto)
  decision!: DraftReviewDecisionDto;

  @ApiPropertyOptional({ description: '审批备注（cancel 时可用）' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}
