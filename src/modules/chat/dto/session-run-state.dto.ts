import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WriteDraftEditPolicyDto, WriteDraftPublicDto } from '../../../common/dto/write-draft-public.dto';

export class PendingWriteGatePublicStateDto {
  @ApiProperty({ description: '挂起时的 Agent Run ID' })
  runId!: number;

  @ApiProperty({ description: '本轮对话 turn ID' })
  turnId!: number;

  @ApiProperty({ description: '已消耗的重试次数' })
  draftRetryCount!: number;

  @ApiPropertyOptional({
    nullable: true,
    description: '重试上限；null 表示不限制',
    example: null,
  })
  draftRetryMax!: number | null;

  @ApiProperty({ description: '是否仍可发起 retry' })
  canRetry!: boolean;

  @ApiPropertyOptional({
    type: WriteDraftPublicDto,
    description: '主写草稿（机器层真值，arguments 为执行依据）',
  })
  writeDraft?: WriteDraftPublicDto;

  @ApiPropertyOptional({
    type: [WriteDraftPublicDto],
    description: '多写工具时全部草稿（含 writeDraft 本身）',
  })
  writeDrafts?: WriteDraftPublicDto[];

  @ApiPropertyOptional({
    type: WriteDraftEditPolicyDto,
    nullable: true,
    description: '主写草稿的字段编辑策略（由 Tool.agentMetadata.draftReview 推导）',
  })
  editPolicy?: WriteDraftEditPolicyDto | null;

  @ApiPropertyOptional({
    type: [WriteDraftEditPolicyDto],
    description: '多写工具时各草稿对应的编辑策略',
  })
  editPolicies?: WriteDraftEditPolicyDto[];
}

export class SessionRunStateResponseDto {
  @ApiProperty({
    description: '当前 session generation；前端应用作 sessionGeneration',
  })
  generation!: number;

  @ApiPropertyOptional({
    nullable: true,
    description: '正在执行的 runId；本实例 active 优先，否则 Redis active 快照',
  })
  activeRunId!: number | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'active run 对应 turnId',
  })
  activeTurnId!: number | null;

  @ApiProperty({
    description: '排队 job 数（本实例内存队列 + Redis 队列）',
  })
  pendingJobCount!: number;

  @ApiProperty({
    description:
      'generation / 队列 / SSE 中继是否由 Redis 支撑（生产环境应为 true）',
  })
  redisBacked!: boolean;

  @ApiPropertyOptional({
    nullable: true,
    type: PendingWriteGatePublicStateDto,
    description:
      '挂起中的 Chat 写确认门（含 writeDraft）；无 gate 时为 null。页面刷新时可与 SSE 重放互补使用。',
  })
  pendingWriteGate!: PendingWriteGatePublicStateDto | null;
}
