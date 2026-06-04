import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { ToolLevel } from '../../../../generated/prisma/client';

export class UpdateSkillDto {
  @ApiPropertyOptional({ description: 'Skill 名称（同一 Agent 内唯一）' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '业务指引文案' })
  @IsOptional()
  @IsString()
  prompt?: string;

  @ApiPropertyOptional({
    description: '能力键；传空字符串可清空',
    example: 'order.inquiry',
  })
  @IsOptional()
  @IsString()
  capabilityKey?: string | null;

  @ApiPropertyOptional({ description: '描述；传空字符串可清空' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ description: '扩展配置 JSON' })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: '风险等级；L2/L3 写操作需用户确认',
    enum: ToolLevel,
  })
  @IsOptional()
  @IsEnum(ToolLevel)
  riskLevel?: ToolLevel;
}
