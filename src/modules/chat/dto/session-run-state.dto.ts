import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}
