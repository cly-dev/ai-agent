import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class DebugToolDto {
  @ApiPropertyOptional({
    description:
      '请求参数：用于 path 占位符、OpenAPI query/header 参数及 JSON body（与 Agent 调用 tool 时 input 一致）',
    example: { orderId: '10001', page: 1 },
    type: Object,
  })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: '自定义请求头；同名键会覆盖默认头（含 Authorization）',
    example: { 'X-Tenant-Id': 'demo', Authorization: 'Bearer debug-token' },
    type: Object,
  })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({
    description: '调试时临时覆盖 Integration 系统 apiKey（未传则使用库中配置）',
  })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({
    description: '本次调试超时（毫秒）；未传则使用工具 timeout 或默认 10000',
    example: 10000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  timeoutMs?: number;
}
