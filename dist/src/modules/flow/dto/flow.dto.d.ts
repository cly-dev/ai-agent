import { WorkflowDeliverable, WorkflowProfile } from '../../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/pagination';
import type { WorkflowPresetKind } from '../../../core/workflow/workflow-preset.types';
import { WorkflowHostToolBindingDto, WorkflowToolBindingDto } from '../../workflow/dto/workflow.dto';
export declare class CreateFlowDto {
    appClientId: number;
    flowKey: string;
    name: string;
    description?: string | null;
    goal?: string | null;
    profile: WorkflowProfile;
    deliverable?: WorkflowDeliverable;
    preset?: WorkflowPresetKind;
    presetConfig?: Record<string, unknown>;
    intent?: Record<string, unknown>;
    constraints?: string[];
    isActive?: boolean;
    sortOrder?: number;
    tools?: WorkflowToolBindingDto[];
    hostTools?: WorkflowHostToolBindingDto[];
    changeNote?: string;
}
export declare class UpdateFlowDto {
    name?: string;
    description?: string | null;
    goal?: string | null;
    deliverable?: WorkflowDeliverable;
    preset?: WorkflowPresetKind;
    presetConfig?: Record<string, unknown>;
    intent?: Record<string, unknown>;
    constraints?: string[];
    isActive?: boolean;
    sortOrder?: number;
    tools?: WorkflowToolBindingDto[];
    hostTools?: WorkflowHostToolBindingDto[];
    changeNote?: string;
}
export declare class QueryFlowRevisionsDto {
    limit?: number;
    summary?: boolean;
}
export declare class QueryFlowPresetCatalogDto {
    profile?: WorkflowProfile;
}
export declare class AllocateWorkflowIntentStateKeysDto {
    labels: string[];
}
export declare class QueryFlowDto extends PaginationQueryDto {
    appClientId?: number;
    profile?: WorkflowProfile;
    isActive?: boolean;
    keyword?: string;
}
export declare class MigrateFlowFromWorkflowDto {
    flowKey?: string;
    rebindBindings?: boolean;
    deactivateSource?: boolean;
    changeNote?: string;
}
