import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** C 端：按 Agent 查询用户可见 Skill 列表（可选筛选）。 */
export class QueryClientSkillByAgentDto {
  @ApiPropertyOptional({
    description:
      '页面 scope（与 pageContext.page / HostPage.scope 一致，kebab-case）。传入后仅返回该页可展示的 Skill：页内 Host Skill 须与当前页 host_tool 有交集；纯 HTTP Skill 仍全站可见。',
    example: 'comment-detail',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  page?: string;

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
