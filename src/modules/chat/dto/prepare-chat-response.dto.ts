import { ApiProperty } from '@nestjs/swagger';

export class PrepareChatResponseDto {
  @ApiProperty({ description: '会话 ID（32 位 hex）' })
  sessionId!: string;

  @ApiProperty({ description: '是否完成预热' })
  prepared!: boolean;

  @ApiProperty({ description: 'Agent runtime 是否已加载' })
  agentReady!: boolean;

  @ApiProperty({ description: '权限内可用工具数量' })
  toolsCount!: number;

  @ApiProperty({ description: 'Agent 关联且角色可见的 Skill 数量' })
  skillsCount!: number;

  @ApiProperty({ description: '会话历史 context 是否已写入 Redis' })
  sessionContextWarmed!: boolean;

  @ApiProperty({ description: '预热完成时间（ISO 8601）' })
  warmedAt!: string;

  @ApiProperty({ description: 'tools 缓存是否命中 Redis（未重复查库）' })
  fromCache!: boolean;
}
