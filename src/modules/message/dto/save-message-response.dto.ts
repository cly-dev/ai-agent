import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** POST /chat/:sessionId/messages 响应（user 消息触发 Agent 时含 runGeneration）。 */
export class SaveMessageResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  sessionId!: string;

  @ApiProperty()
  role!: string;

  @ApiPropertyOptional()
  content!: string | null;

  @ApiPropertyOptional({
    description:
      'role=user 且触发 Agent 调度时的 session generation；前端应同步 sessionGeneration',
  })
  runGeneration?: number;
}
