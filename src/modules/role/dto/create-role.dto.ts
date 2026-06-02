import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ToolLevel } from '../../../../generated/prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'operator', description: '角色唯一标识名' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ description: '角色说明' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: ToolLevel,
    default: ToolLevel.L1,
    description: '该角色允许使用的最高工具风险等级',
  })
  @IsOptional()
  @IsEnum(ToolLevel)
  allowToolLevel?: ToolLevel;
}
