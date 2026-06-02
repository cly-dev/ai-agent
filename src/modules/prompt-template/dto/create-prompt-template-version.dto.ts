import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { PROMPT_KEY_LIST } from '../../../core/prompt/prompt-template.keys';

export class CreatePromptTemplateVersionDto {
  @ApiProperty({
    example: 'platform.response_style',
    enum: PROMPT_KEY_LIST,
    description: '仅允许系统注册的 key，见 GET /prompt-template/keys',
  })
  @IsString()
  @MinLength(1)
  @IsIn(PROMPT_KEY_LIST, {
    message: `key must be one of: ${PROMPT_KEY_LIST.join(', ')}`,
  })
  key!: string;

  @ApiPropertyOptional({ description: 'null/省略 = 全局' })
  @IsOptional()
  @IsInt()
  @Min(1)
  appClientId?: number;

  @ApiPropertyOptional({ description: 'null/省略 = 非 Agent 专属' })
  @IsOptional()
  @IsInt()
  @Min(1)
  agentId?: number;

  @ApiPropertyOptional({ default: 'zh-CN' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional({ example: 'platform' })
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

  @ApiProperty()
  @IsString()
  @MinLength(1)
  content!: string;

  @ApiPropertyOptional({ description: '创建后是否立即发布为 active' })
  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}
