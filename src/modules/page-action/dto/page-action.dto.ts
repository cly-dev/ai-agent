import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PageActionDelivery } from '../../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/pagination';
import { AgentChatPageContextDto } from '../../chat/dto/page-context-fields.dto';

export class QueryPageScopeOptionsDto {
  @ApiPropertyOptional({
    description: '仅返回 isActive=true 的 HostPage scope（默认 true，适合下拉）',
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  activeOnly?: boolean;
}

export class QueryPageActionDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  appClientId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pageScope?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

export class CreatePageActionDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  appClientId!: number;

  @ApiProperty({ example: 'demo-playground.fill_draft' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  actionKey!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description:
      '已存在的 HostTool ID，可选。填入类 PageAction 建议绑定；分析类可不绑。',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value != null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hostToolId?: number | null;

  @ApiPropertyOptional({
    description: '与 pageContext.page 对齐',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  pageScope?: string | null;

  @ApiProperty({ description: '系统提示词（运行时主真值）' })
  @IsString()
  @IsNotEmpty()
  systemPrompt!: string;

  @ApiPropertyOptional({
    enum: [PageActionDelivery.inline_stream],
    default: PageActionDelivery.inline_stream,
    description: '固定 inline_stream（sync 已废弃）',
  })
  @IsOptional()
  @IsEnum(PageActionDelivery)
  defaultDelivery?: PageActionDelivery;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  allowCustomInstruction?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({ description: '从 Skill 导入时的追溯 ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sourceSkillId?: number | null;

  @ApiPropertyOptional({ description: '引用的 Workflow 资产 ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  workflowId?: number | null;

  @ApiPropertyOptional({ description: 'pin Workflow revision version' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  workflowVersion?: number | null;

  @ApiPropertyOptional({ description: '按 nodeId 覆盖 objective 等字段' })
  @IsOptional()
  @IsObject()
  workflowOverrides?: Record<string, { objective?: string }> | null;
}

export class UpdatePageActionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({
    description:
      '已存在的 HostTool ID，可选。填入类 PageAction 建议绑定；分析类可不绑。传 null 可清空。',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value != null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hostToolId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  pageScope?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @ApiPropertyOptional({
    enum: [PageActionDelivery.inline_stream],
    default: PageActionDelivery.inline_stream,
    description: '固定 inline_stream（sync 已废弃）',
  })
  @IsOptional()
  @IsEnum(PageActionDelivery)
  defaultDelivery?: PageActionDelivery;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowCustomInstruction?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: '引用的 Workflow 资产 ID；传 null 可清空' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  workflowId?: number | null;

  @ApiPropertyOptional({ description: 'pin Workflow revision version' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  workflowVersion?: number | null;

  @ApiPropertyOptional({ description: '按 nodeId 覆盖 objective 等字段' })
  @IsOptional()
  @IsObject()
  workflowOverrides?: Record<string, { objective?: string }> | null;
}

export class InvokePageActionDto {
  @ApiProperty({ example: 'demo-playground.fill_draft' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  actionKey!: string;

  @ApiPropertyOptional({ type: AgentChatPageContextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AgentChatPageContextDto)
  pageContext?: AgentChatPageContextDto;

  @ApiPropertyOptional({ description: '用户侧补充说明' })
  @IsOptional()
  @IsString()
  @MaxLength(32_768)
  instruction?: string;

  @ApiPropertyOptional({ description: '结构化上下文 JSON' })
  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;

  @ApiPropertyOptional({ description: '幂等键，防重复提交' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  idempotencyKey?: string;

  @ApiPropertyOptional({ description: '前端埋点 ID' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  clientActionId?: string;
}

export class QueryPageActionRunDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '按 PageAction 配置 id 过滤' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageActionId?: number;

  @ApiPropertyOptional({ description: '按 actionKey 模糊匹配' })
  @IsOptional()
  @IsString()
  actionKey?: string;

  @ApiPropertyOptional({
    enum: ['running', 'awaiting_approval', 'completed', 'failed', 'cancelled'],
  })
  @IsOptional()
  @IsIn(['running', 'awaiting_approval', 'completed', 'failed', 'cancelled'])
  status?:
    | 'running'
    | 'awaiting_approval'
    | 'completed'
    | 'failed'
    | 'cancelled';

  @ApiPropertyOptional({ description: 'C 端用户 id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @ApiPropertyOptional({ description: 'clientActionId 精确匹配' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  clientActionId?: string;
}
