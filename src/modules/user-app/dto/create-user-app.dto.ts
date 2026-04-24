import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateUserAppDto {
  @ApiProperty({ description: '用户 ID', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number;

  @ApiProperty({ description: '应用 ID（AppClient）', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  appId!: number;

  @ApiProperty({ description: '角色 ID（必填）', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roleId!: number;
}
