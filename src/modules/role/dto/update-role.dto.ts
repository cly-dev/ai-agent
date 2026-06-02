import { ApiPropertyOptional } from '@nestjs/swagger';
import { ToolLevel } from '../../../../generated/prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'operator' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ description: '传 null 可清空说明' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ enum: ToolLevel })
  @IsOptional()
  @IsEnum(ToolLevel)
  allowToolLevel?: ToolLevel;
}
