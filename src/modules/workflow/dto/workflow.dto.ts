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

export const WORKFLOW_PRESET_KIND_VALUES = [
  'page_auto_fill',
  'fetch_and_answer',
  'mutation_submit',
] as const satisfies readonly WorkflowPresetKind[];

export class WorkflowToolBindingDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  toolId!: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class WorkflowHostToolBindingDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hostToolId!: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class CreateWorkflowDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  appClientId!: number;

  @ApiProperty({ example: 'campaign.auto_fill' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  workflowKey!: string;

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

  @ApiPropertyOptional({
    enum: WORKFLOW_PRESET_KIND_VALUES,
    description:
      '场景 Preset：与 presetConfig 一起展开为 Intent 再编译 IR；与 intent 互斥',
  })
  @IsOptional()
  @IsIn([...WORKFLOW_PRESET_KIND_VALUES])
  preset?: WorkflowPresetKind;

  @ApiPropertyOptional({
    description:
      'Preset 参数：hostToolId / readToolId / writeToolId；变更可选 explainBeforeConfirm / summarizeAfter',
  })
  @ValidateIf((dto: CreateWorkflowDto) => dto.preset != null)
  @IsObject()
  presetConfig?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      '配置真源 WorkflowIntent（operation+capability）。与 preset 二选一。禁止再传旧 nodes[] IR。',
  })
  @ValidateIf((dto: CreateWorkflowDto) => dto.preset == null)
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

  @ApiPropertyOptional({
    type: [WorkflowToolBindingDto],
    description:
      '可选。仅覆盖 isRequired；绑定 ID 从 Intent slots / 编译 IR 推导',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowToolBindingDto)
  tools?: WorkflowToolBindingDto[];

  @ApiPropertyOptional({
    type: [WorkflowHostToolBindingDto],
    description:
      '可选。仅覆盖 isRequired；绑定 ID 从 Intent slots / 编译 IR 推导',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowHostToolBindingDto)
  hostTools?: WorkflowHostToolBindingDto[];

  @ApiPropertyOptional({ description: '首版 revision 备注' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeNote?: string;
}

export class UpdateWorkflowDto {
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

  @ApiPropertyOptional({
    enum: WORKFLOW_PRESET_KIND_VALUES,
    description: '场景 Preset：重新展开为 Intent 并编译 IR',
  })
  @IsOptional()
  @IsIn([...WORKFLOW_PRESET_KIND_VALUES])
  preset?: WorkflowPresetKind;

  @ApiPropertyOptional({ description: 'Preset 参数' })
  @ValidateIf((dto: UpdateWorkflowDto) => dto.preset != null)
  @IsObject()
  presetConfig?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      '更新 Intent 会递增 version 并写 revision；与 preset 二选一。禁止旧 nodes IR。',
  })
  @ValidateIf((dto: UpdateWorkflowDto) => dto.preset == null)
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

  @ApiPropertyOptional({
    type: [WorkflowToolBindingDto],
    description:
      '可选。仅用于为 nodes[].input.toolIds/toolId 覆盖 isRequired；绑定 ID 必须在节点 input 上声明，省略则自动从 nodes 推导',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowToolBindingDto)
  tools?: WorkflowToolBindingDto[];

  @ApiPropertyOptional({
    type: [WorkflowHostToolBindingDto],
    description:
      '可选。仅用于为 nodes[].input.hostToolIds/hostToolId 覆盖 isRequired；绑定 ID 必须在节点 input 上声明，省略则自动从 nodes 推导',
  })
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

export class QueryWorkflowRevisionsDto {
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
      'true 时仅返回版本元数据（version / changeNote / isCurrent），不含 nodes 快照',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  summary?: boolean;
}

export class QueryWorkflowDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  appClientId?: number;

  @ApiPropertyOptional({ enum: WorkflowProfile })
  @IsOptional()
  @IsEnum(WorkflowProfile)
  profile?: WorkflowProfile;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class WorkflowOverridesDto {
  @ApiPropertyOptional({ description: '按 nodeId 覆盖 objective' })
  @IsOptional()
  @IsObject()
  overrides?: Record<string, { objective?: string }>;
}
