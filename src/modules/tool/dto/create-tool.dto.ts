import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { HttpMethod, ToolLevel } from '../../../../generated/prisma/client';

export class CreateToolDto {
  @ApiProperty({ description: '所属 AppClient ID', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  appClientId!: number;

  @ApiProperty({ description: '工具名称（唯一标识，供 LLM tool_call）', example: 'getOrderList' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description:
      '业务能力键：同一 AppClient 内唯一，用于跨系统对齐；未传则按类目/method/path/name 自动生成',
    example: 'order.get.getOrderList',
  })
  @IsOptional()
  @IsString()
  definitionKey?: string;

  @ApiProperty({ description: '工具描述' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ description: '风险等级', enum: ToolLevel, default: ToolLevel.L1 })
  @IsOptional()
  @IsEnum(ToolLevel)
  riskLevel?: ToolLevel;

  @ApiProperty({ description: 'OpenAPI / JSON Schema 参数结构' })
  @IsObject()
  schema!: Record<string, unknown>;

  @ApiProperty({ description: 'LangChain inputSchema' })
  @IsObject()
  inputSchema!: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'outputSchema' })
  @IsOptional()
  @IsObject()
  outputSchema?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      '工具响应裁剪配置：coreFields（核心字段）/ optionalFields（按用户问题追加）/ arrayLimits / listPath',
    example: {
      coreFields: [
        { path: 'id', label: '商品ID', description: '商品唯一标识' },
        { path: 'title', label: '标题', description: '商品标题' },
        {
          path: 'status',
          label: '状态',
          description: '商品上架状态',
          enumLabels: { '1': '草稿', '2': '上架' },
        },
      ],
      optionalFields: [
        {
          path: 'seoList',
          label: 'SEO配置',
          description: 'SEO 标题与关键词列表',
          keywords: ['seo', '搜索', '关键词'],
        },
      ],
      arrayLimits: { list: 100 },
    },
  })
  @IsOptional()
  @IsObject()
  responseProfile?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      'Agent 选工具元数据：mode / resource / operation / businessFields / aliases / examples / priority。paramFormatHints 无需填写，保存时从 inputSchema.parameters（及 requestBody）的 description/format/enum 自动推导。',
    example: {
      mode: 'READ',
      resource: 'PRODUCT',
      operation: 'DETAIL',
      businessFields: ['productId'],
      aliases: ['商品详情'],
      examples: [],
      priority: 100,
      isMutation: false,
    },
  })
  @IsOptional()
  @IsObject()
  agentMetadata?: Record<string, unknown>;

  @ApiProperty({ description: 'HTTP 方法', enum: HttpMethod })
  @IsEnum(HttpMethod)
  method!: HttpMethod;

  @ApiProperty({ description: 'API 路径', example: '/api/orders' })
  @IsString()
  path!: string;

  @ApiProperty({ description: '关联 Integration ID', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  integrationId!: number;

  @ApiPropertyOptional({ description: '工具分类 ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  toolCategoryId?: number;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '超时毫秒数', example: 10000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  timeout?: number;
}
