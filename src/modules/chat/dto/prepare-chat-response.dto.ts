import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { RuntimeRevision } from '../../../core/runtime-cache/runtime-cache.types';

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

  @ApiProperty({ description: '当前页面预热的 HostTool 数量（无 page 时为 0）' })
  hostToolsCount!: number;

  @ApiPropertyOptional({
    description: '本次预热对应的 HostPage.scope',
    nullable: true,
  })
  pageScope!: string | null;

  @ApiProperty({ description: '会话历史 context 是否已写入 Redis' })
  sessionContextWarmed!: boolean;

  @ApiProperty({ description: '预热完成时间（ISO 8601）' })
  warmedAt!: string;

  @ApiProperty({ description: '会话运行快照是否命中 Redis（revision 一致）' })
  fromCache!: boolean;

  @ApiPropertyOptional({ description: '运行快照 revision（调试用）' })
  revision?: RuntimeRevision;
}
