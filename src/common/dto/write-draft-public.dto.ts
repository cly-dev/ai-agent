import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** MessageBlock 最小 Swagger 描述（完整类型见 message-blocks.types.ts）。 */
export class MessageBlockDto {
  @ApiProperty({ example: 'text' })
  type!: string;

  @ApiPropertyOptional({ example: '预览正文' })
  content?: string;

  @ApiPropertyOptional({ enum: ['markdown', 'plain', 'html'] })
  format?: string;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  language?: string;
}

export class WriteDraftToolPublicDto {
  @ApiProperty({ example: 'submit_review' })
  name!: string;

  @ApiPropertyOptional({ example: 42 })
  toolId?: number;

  @ApiProperty({ example: 'L2' })
  riskLevel!: string;
}

export class WriteDraftPresentationPublicDto {
  @ApiPropertyOptional({ nullable: true, example: '即将提交评价回复' })
  summaryText?: string | null;

  @ApiProperty({ type: [MessageBlockDto] })
  previewBlocks!: MessageBlockDto[];
}

export class WriteDraftProvenancePublicDto {
  @ApiProperty({ example: 0 })
  draftRetryCount!: number;

  @ApiPropertyOptional({
    nullable: true,
    description: '重试上限；null 表示不限制',
    example: null,
  })
  draftRetryMax!: number | null;

  @ApiProperty({ example: true })
  canRetry!: boolean;

  @ApiProperty({ example: '2026-07-03T03:00:00.000Z' })
  composedAt!: string;

  @ApiProperty({
    enum: ['composed', 'suspended', 'user_edit', 'retry'],
    example: 'suspended',
  })
  lastEvent!: 'composed' | 'suspended' | 'user_edit' | 'retry';
}

/** C 端 WriteDraft 公开结构（SSE / run-state / inbox 共用）。 */
export class WriteDraftPublicDto {
  @ApiProperty({ example: 1 })
  version!: number;

  @ApiProperty({ type: WriteDraftToolPublicDto })
  tool!: WriteDraftToolPublicDto;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: { content: '生成的正文' },
    description: '写 HTTP 执行真值',
  })
  arguments!: Record<string, unknown>;

  @ApiProperty({ type: WriteDraftPresentationPublicDto })
  presentation!: WriteDraftPresentationPublicDto;

  @ApiProperty({ type: WriteDraftProvenancePublicDto })
  provenance!: WriteDraftProvenancePublicDto;
}
