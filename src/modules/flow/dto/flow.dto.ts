import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
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
import {
  WorkflowDeliverable,
  WorkflowProfile,
} from '../../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/pagination';
import type { WorkflowPresetKind } from '../../../core/workflow/workflow-preset.types';
import {
  WORKFLOW_PRESET_KIND_VALUES,
  WorkflowHostToolBindingDto,
  WorkflowToolBindingDto,
} from '../../workflow/dto/workflow.dto';

export class CreateFlowDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  appClientId!: number;

  @ApiProperty({ example: 'campaign.auto_fill' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  flowKey!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  goal?: string | null;

  @ApiProperty({ enum: WorkflowProfile })
  @IsEnum(WorkflowProfile)
  profile!: WorkflowProfile;

  @ApiPropertyOptional({ enum: WorkflowDeliverable, default: WorkflowDeliverable.answer })
  @IsOptional()
  @IsEnum(WorkflowDeliverable)
  deliverable?: WorkflowDeliverable;

  @ApiPropertyOptional({ enum: WORKFLOW_PRESET_KIND_VALUES })
  @IsOptional()
  @IsIn([...WORKFLOW_PRESET_KIND_VALUES])
  preset?: WorkflowPresetKind;

  @ApiPropertyOptional()
  @ValidateIf((dto: CreateFlowDto) => dto.preset != null)
  @IsObject()
  presetConfig?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'WorkflowIntent；与 preset 二选一',
  })
  @ValidateIf((dto: CreateFlowDto) => dto.preset == null)
  @IsObject()
  intent?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  constraints?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ type: [WorkflowToolBindingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowToolBindingDto)
  tools?: WorkflowToolBindingDto[];

  @ApiPropertyOptional({ type: [WorkflowHostToolBindingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowHostToolBindingDto)
  hostTools?: WorkflowHostToolBindingDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeNote?: string;
}

export class UpdateFlowDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  goal?: string | null;

  @ApiPropertyOptional({ enum: WorkflowDeliverable })
  @IsOptional()
  @IsEnum(WorkflowDeliverable)
  deliverable?: WorkflowDeliverable;

  @ApiPropertyOptional({ enum: WORKFLOW_PRESET_KIND_VALUES })
  @IsOptional()
  @IsIn([...WORKFLOW_PRESET_KIND_VALUES])
  preset?: WorkflowPresetKind;

  @ApiPropertyOptional()
  @ValidateIf((dto: UpdateFlowDto) => dto.preset != null)
  @IsObject()
  presetConfig?: Record<string, unknown>;

  @ApiPropertyOptional()
  @ValidateIf((dto: UpdateFlowDto) => dto.preset == null)
  @IsOptional()
  @IsObject()
  intent?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  constraints?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ type: [WorkflowToolBindingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowToolBindingDto)
  tools?: WorkflowToolBindingDto[];

  @ApiPropertyOptional({ type: [WorkflowHostToolBindingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowHostToolBindingDto)
  hostTools?: WorkflowHostToolBindingDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeNote?: string;
}

export class QueryFlowRevisionsDto {
  @ApiPropertyOptional({
    default: 20,
    description: '返回条数上限，最大 100',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description:
      'true 时仅返回版本元数据（version / changeNote / isCurrent），不含 intent/ir 快照',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  summary?: boolean;
}

/** GET /flow/presets/catalog */
export class QueryFlowPresetCatalogDto {
  @ApiPropertyOptional({
    enum: WorkflowProfile,
    description: '按 profile 过滤；产品创建固定 shared 时可省略',
  })
  @IsOptional()
  @IsEnum(WorkflowProfile)
  profile?: WorkflowProfile;
}

/**
 * POST /flow/intent/state-keys
 * 画布「状态名称」→ Intent state.key（与服务端 slug 算法一致）。
 */
export class AllocateWorkflowIntentStateKeysDto {
  @ApiProperty({
    type: [String],
    example: ['可回答', '需变更', '可回答'],
    description: '运营填写的状态名称；同批冲突自动加 _2/_3',
  })
  @IsArray()
  @IsString({ each: true })
  labels!: string[];
}

export class QueryFlowDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  appClientId?: number;

  @ApiPropertyOptional({ enum: WorkflowProfile })
  @IsOptional()
  @IsEnum(WorkflowProfile)
  profile?: WorkflowProfile;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;
}

/** POST /flow/migrate-from-workflow/:workflowId */
export class MigrateFlowFromWorkflowDto {
  @ApiPropertyOptional({
    description: '目标 flowKey；默认沿用 workflow.workflowKey',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  flowKey?: string;

  @ApiPropertyOptional({
    description: '将引用该 Workflow 的 Skill / PageAction 改绑到新 Flow',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  rebindBindings?: boolean;

  @ApiPropertyOptional({
    description: '迁移成功后将源 Workflow.isActive=false',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  deactivateSource?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeNote?: string;
}
