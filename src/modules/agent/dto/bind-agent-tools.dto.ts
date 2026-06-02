import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, Min } from 'class-validator';

export class BindAgentToolsDto {
  @ApiProperty({
    description: 'Tool ID 列表（须属于同一 AppClient；用于绑定或解绑）',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  toolIds!: number[];
}
