import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ToolLevel } from '../../../../generated/prisma/client';
import { SkillToolBindingItemDto } from './skill-tool-binding.dto';

export class CreateSkillDto {
  @ApiProperty({ description: 'Skill 名称（同一 Agent 内唯一）', example: '订单查询' })
  @IsString()
  name!: string;

  @ApiProperty({ description: '命中后注入 LLM 的业务指引文案' })
  @IsString()
  prompt!: string;

  @ApiPropertyOptional({
    description: '能力键（同一 Agent 内唯一，可选）',
    example: 'order.inquiry',
  })
  @IsOptional()
  @IsString()
  capabilityKey?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '扩展配置 JSON' })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      '风险等级；未传则按关联 Tool 的最高 riskLevel 推断。L2/L3 表示含写操作，运行前需用户确认。',
    enum: ToolLevel,
  })
  @IsOptional()
  @IsEnum(ToolLevel)
  riskLevel?: ToolLevel;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: '初始关联工具（须为 Agent 已绑定的 Tool）',
    type: [SkillToolBindingItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillToolBindingItemDto)
  tools?: SkillToolBindingItemDto[];

  @ApiPropertyOptional({ description: '引用的 Workflow 资产 ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  workflowId?: number | null;

  @ApiPropertyOptional({ description: 'pin Workflow revision version' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  workflowVersion?: number | null;

  @ApiPropertyOptional({ description: '按 nodeId 覆盖 objective 等字段' })
  @IsOptional()
  @IsObject()
  workflowOverrides?: Record<string, { objective?: string }> | null;
}
