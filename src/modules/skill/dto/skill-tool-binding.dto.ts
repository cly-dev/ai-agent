import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, Min, ValidateNested } from 'class-validator';

export class SkillToolBindingItemDto {
  @ApiProperty({ description: 'Tool ID（须已绑定到该 Agent）', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  toolId!: number;

  @ApiPropertyOptional({
    description: '是否为 Skill 激活 gate 的必选工具',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class ReplaceSkillToolsDto {
  @ApiProperty({
    description: 'Skill 关联工具列表（全量替换；须为 Agent 已绑定的 Tool）',
    type: [SkillToolBindingItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillToolBindingItemDto)
  tools!: SkillToolBindingItemDto[];
}
