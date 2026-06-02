import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

/** 仅可改展示字段与正文；key / 作用域 / 版本不可改。 */
export class UpdatePromptTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '模板正文' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;
}
