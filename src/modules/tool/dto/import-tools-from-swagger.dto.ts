import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  IntegrationAuthMode,
} from '../../../../generated/prisma/client';

function parseOptionalCsv(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item).split(','))
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export class ImportToolsFromSwaggerDto {
  @ApiProperty({
    description: 'OpenAPI JSON 文档地址（与 swagger-tool-cli 的 --spec-url 一致）',
    example: 'https://api.example.com/v3/api-docs',
  })
  @IsString()
  @IsUrl({ require_tld: false })
  specUrl!: string;

  @ApiPropertyOptional({
    description: '使用已有 Integration ID（与 autoIntegration 二选一）',
  })
  @ValidateIf((dto: ImportToolsFromSwaggerDto) => !dto.autoIntegration)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  integrationId?: number;

  @ApiPropertyOptional({
    description: '自动按 spec servers[0] 创建/复用 Integration',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  autoIntegration?: boolean;

  @ApiPropertyOptional({
    description: 'autoIntegration 时必填：Integration 所属 AppClient',
  })
  @ValidateIf((dto: ImportToolsFromSwaggerDto) => dto.autoIntegration === true)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  appClientId?: number;

  @ApiPropertyOptional({
    description: '导入后绑定到 Agent（可选，写入 agent_tools）',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  agentId?: number;

  @ApiPropertyOptional({ description: '自动 Integration 名称（默认 spec.info.title）' })
  @IsOptional()
  @IsString()
  integrationName?: string;

  @ApiPropertyOptional({
    description: '自动 Integration baseUrl（默认 servers[0].url）',
  })
  @IsOptional()
  @IsString()
  integrationBaseUrl?: string;

  @ApiPropertyOptional({ description: '系统级 apiKey（写入 Integration）' })
  @IsOptional()
  @IsString()
  integrationApiKey?: string;

  @ApiPropertyOptional({
    description: 'Integration 鉴权模式',
    enum: IntegrationAuthMode,
  })
  @IsOptional()
  @IsEnum(IntegrationAuthMode)
  integrationAuthMode?: IntegrationAuthMode;

  @ApiPropertyOptional({
    description: '仅解析不写库（等同 CLI --dry-run）',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  dryRun?: boolean;

  @ApiPropertyOptional({
    description: '只导入指定 OpenAPI tag（逗号分隔或数组）',
    example: ['order-controller'],
  })
  @IsOptional()
  @Transform(({ value }) => parseOptionalCsv(value))
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: '只导入指定操作，格式 METHOD:/path（逗号分隔或数组）',
    example: ['GET:/api/orders'],
  })
  @IsOptional()
  @Transform(({ value }) => parseOptionalCsv(value))
  @IsArray()
  @IsString({ each: true })
  ops?: string[];

  @ApiPropertyOptional({
    description: 'path 须包含任一子串（逗号分隔或数组）',
  })
  @IsOptional()
  @Transform(({ value }) => parseOptionalCsv(value))
  @IsArray()
  @IsString({ each: true })
  pathInclude?: string[];

  @ApiPropertyOptional({
    description: '排除 path 包含子串的接口（与默认 public/buyer 合并）',
  })
  @IsOptional()
  @Transform(({ value }) => parseOptionalCsv(value))
  @IsArray()
  @IsString({ each: true })
  pathExclude?: string[];

  @ApiPropertyOptional({
    description: '关闭默认 path 排除（public、buyer）',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  noDefaultPathExclude?: boolean;

  @ApiPropertyOptional({
    description: '下载 spec 时跳过 TLS 证书校验',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  insecure?: boolean;
}
