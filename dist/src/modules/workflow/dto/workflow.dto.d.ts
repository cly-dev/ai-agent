import { WorkflowDeliverable, WorkflowProfile } from '../../../../generated/prisma/client';
import { PaginationQueryDto } from '../../../common/pagination';
import type { WorkflowPresetKind } from '../../../core/workflow/workflow-preset.types';
export declare const WORKFLOW_PRESET_KIND_VALUES: readonly ["page_auto_fill", "page_context_push", "fetch_push_summarize", "fetch_and_answer", "mutation_submit", "page_context_mutation_submit"];
export declare class WorkflowToolBindingDto {
    toolId: number;
    isRequired?: boolean;
}
export declare class WorkflowHostToolBindingDto {
    hostToolId: number;
    isRequired?: boolean;
}
export declare class CreateWorkflowDto {
    appClientId: number;
    workflowKey: string;
    name: string;
    description?: string | null;
    goal?: string | null;
    profile: WorkflowProfile;
    deliverable?: WorkflowDeliverable;
    preset?: WorkflowPresetKind;
    presetConfig?: Record<string, unknown>;
    nodes?: unknown;
    constraints?: string[];
    isActive?: boolean;
    sortOrder?: number;
    tools?: WorkflowToolBindingDto[];
    hostTools?: WorkflowHostToolBindingDto[];
    changeNote?: string;
}
export declare class UpdateWorkflowDto {
    name?: string;
    description?: string | null;
    goal?: string | null;
    deliverable?: WorkflowDeliverable;
    preset?: WorkflowPresetKind;
    presetConfig?: Record<string, unknown>;
    nodes?: unknown;
    constraints?: string[];
    isActive?: boolean;
    sortOrder?: number;
    tools?: WorkflowToolBindingDto[];
    hostTools?: WorkflowHostToolBindingDto[];
    changeNote?: string;
}
export declare class QueryWorkflowRevisionsDto {
    limit?: number;
    summary?: boolean;
}
export declare class QueryWorkflowDto extends PaginationQueryDto {
    appClientId?: number;
    profile?: WorkflowProfile;
    isActive?: boolean;
    keyword?: string;
}
export declare class WorkflowOverridesDto {
    overrides?: Record<string, {
        objective?: string;
    }>;
}
