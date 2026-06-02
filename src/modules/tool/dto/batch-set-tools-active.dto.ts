import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsBoolean, IsInt, Min } from 'class-validator';

export class BatchSetToolsActiveDto {
  @ApiProperty({
    description: '工具 ID 列表',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids!: number[];

  @ApiProperty({
    description: '目标启用状态：true 批量启用，false 批量禁用',
    example: false,
  })
  @IsBoolean()
  isActive!: boolean;
}
