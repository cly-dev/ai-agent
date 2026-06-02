import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateIntentRecallConfigDto {
  @ApiPropertyOptional({ enum: ['auto', 'vector', 'keyword'] })
  @IsOptional()
  @IsIn(['auto', 'vector', 'keyword'])
  recallMode?: 'auto' | 'vector' | 'keyword';

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  vectorTopK?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  vectorMinScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  bindToolsMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  fallbackToKeyword?: boolean;
}
