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
  'page_context_push',
  'fetch_push_summarize',
  'fetch_and_answer',
  'mutation_submit',
  'page_context_mutation_submit',
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
      '场景 Preset：与 presetConfig 一起使用时，服务端展开为 nodes[] 再保存；与 nodes 互斥',
  })
  @IsOptional()
  @IsIn([...WORKFLOW_PRESET_KIND_VALUES])
  preset?: WorkflowPresetKind;

  @ApiPropertyOptional({
    description:
      'Preset 参数：如 hostToolId / readToolId / writeToolId / objectives 等，见 GET /workflow/presets/catalog',
  })
  @ValidateIf((dto: CreateWorkflowDto) => dto.preset != null)
  @IsObject()
  presetConfig?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      'WorkflowNodeDef[]；与 preset 二选一。fetch_data 须 input.toolId，generate_and_push 须 input.hostToolId',
  })
  @ValidateIf((dto: CreateWorkflowDto) => dto.preset == null)
  @IsArray()
  nodes?: Record<string, unknown>[];

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
      '可选。仅用于为 nodes[].input.toolId 覆盖 isRequired；绑定 ID 必须在节点 input 上声明，省略则自动从 nodes 推导',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowToolBindingDto)
  tools?: WorkflowToolBindingDto[];

  @ApiPropertyOptional({
    type: [WorkflowHostToolBindingDto],
    description:
      '可选。仅用于为 nodes[].input.hostToolId 覆盖 isRequired；绑定 ID 必须在节点 input 上声明，省略则自动从 nodes 推导',
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
    description: '场景 Preset：与 presetConfig 一起使用时重新展开 nodes[]',
  })
  @IsOptional()
  @IsIn([...WORKFLOW_PRESET_KIND_VALUES])
  preset?: WorkflowPresetKind;

  @ApiPropertyOptional({ description: 'Preset 参数' })
  @ValidateIf((dto: UpdateWorkflowDto) => dto.preset != null)
  @IsObject()
  presetConfig?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: '更新 nodes 会递增 version 并写 revision；与 preset 二选一',
  })
  @ValidateIf((dto: UpdateWorkflowDto) => dto.preset == null)
  @IsOptional()
  @IsArray()
  nodes?: Record<string, unknown>[];

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
      '可选。仅用于为 nodes[].input.toolId 覆盖 isRequired；绑定 ID 必须在节点 input 上声明，省略则自动从 nodes 推导',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowToolBindingDto)
  tools?: WorkflowToolBindingDto[];

  @ApiPropertyOptional({
    type: [WorkflowHostToolBindingDto],
    description:
      '可选。仅用于为 nodes[].input.hostToolId 覆盖 isRequired；绑定 ID 必须在节点 input 上声明，省略则自动从 nodes 推导',
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
