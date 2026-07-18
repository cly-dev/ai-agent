import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';
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

  @ApiPropertyOptional({
    description: '【已移除】禁止新绑正数；仅允许 null 清空。请用 flowId / migrate',
    deprecated: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  workflowId?: number | null;

  @ApiPropertyOptional({
    description: '【已移除】随 workflowId 废弃',
    deprecated: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  workflowVersion?: number | null;

  @ApiPropertyOptional({
    description: '引用的 Flow 资产 ID；传 null 可清空',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  flowId?: number | null;

  @ApiPropertyOptional({ description: 'pin Flow revision version' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  flowVersion?: number | null;

  @ApiPropertyOptional({ description: '按 nodeId 覆盖 objective 等字段' })
  @IsOptional()
  @IsObject()
  workflowOverrides?: Record<string, { objective?: string }> | null;
}
