import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { DebugToolDto } from './debug-tool.dto';

export class InitToolSchemasFromDebugDto extends DebugToolDto {
  @ApiPropertyOptional({
    description: '是否将推断结果写回 Tool.outputSchema / Tool.responseProfile',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  persist?: boolean;

  @ApiPropertyOptional({
    description: '补充说明，帮助大模型判断哪些字段应作为 coreFields',
    example: '这是商品详情接口，status 和 seoList 很重要',
  })
  @IsOptional()
  @IsString()
  hint?: string;
}
