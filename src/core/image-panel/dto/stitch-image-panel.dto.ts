import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class StitchImagePanelDto {
  @ApiProperty({
    description: '图片 URL 列表（http/https）；服务端会去重并最多拼 maxCells 张',
    type: [String],
    example: [
      'https://picsum.photos/seed/panel1/800/600',
      'https://picsum.photos/seed/panel2/600/900',
      'https://picsum.photos/seed/panel3/1200/800',
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { each: true },
  )
  urls!: string[];

  @ApiPropertyOptional({ description: '正方形格边长 px', default: 512 })
  @IsOptional()
  @IsInt()
  @Min(128)
  @Max(1024)
  cellPx?: number;

  @ApiPropertyOptional({ description: '最多拼入格数', default: 6 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  maxCells?: number;
}

export class RecognizeImagePanelDto extends StitchImagePanelDto {
  @ApiPropertyOptional({
    description: '追加给模型的业务提示（可选）',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  hint?: string;
}
