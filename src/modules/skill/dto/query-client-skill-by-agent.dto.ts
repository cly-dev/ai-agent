import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/** C 端：按 Agent 查询用户可见 Skill 列表（可选筛选）。 */
export class QueryClientSkillByAgentDto {
  @ApiPropertyOptional({ description: '名称（模糊，忽略大小写）' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '能力键（模糊，忽略大小写）' })
  @IsOptional()
  @IsString()
  capabilityKey?: string;

  @ApiPropertyOptional({ description: '关键词：匹配 name / description / capabilityKey' })
  @IsOptional()
  @IsString()
  keyword?: string;
}
