import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { HostToolSkillTrigger } from '../../../../generated/prisma/client';

export class BindAgentHostToolsDto {
  @ApiProperty({ description: 'HostTool ID 列表', type: [Number] })
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  hostToolIds!: number[];
}

export class SkillHostToolBindingItemDto {
  @ApiProperty({ description: 'HostTool ID（须已绑定到该 Agent）' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hostToolId!: number;

  @ApiPropertyOptional({ enum: HostToolSkillTrigger })
  @IsOptional()
  @IsEnum(HostToolSkillTrigger)
  trigger?: HostToolSkillTrigger;

  @ApiPropertyOptional({ description: '覆盖 HostTool.argsTemplate' })
  @IsOptional()
  @IsObject()
  argsTemplate?: Record<string, unknown> | null;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  priority?: number;

  @ApiPropertyOptional({
    description: 'Plan / mutation 是否必须执行该 Host Tool',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class ReplaceSkillHostToolsDto {
  @ApiProperty({ type: [SkillHostToolBindingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillHostToolBindingItemDto)
  tools!: SkillHostToolBindingItemDto[];
}
