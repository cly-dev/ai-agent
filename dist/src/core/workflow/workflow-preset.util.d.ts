import type { WorkflowIntent } from './workflow-intent.types';
import type { WorkflowPresetCatalogEntry, WorkflowPresetConfig, WorkflowPresetKind, WorkflowPresetValidationIssue } from './workflow-preset.types';
import type { WorkflowProfile } from './workflow.types';
export declare function expandWorkflowPresetToIntent(input: {
    preset: WorkflowPresetKind;
    profile: WorkflowProfile;
    config: WorkflowPresetConfig;
}): WorkflowIntent;
export declare const WORKFLOW_PRESET_CATALOG: WorkflowPresetCatalogEntry[];
export declare function listWorkflowPresetCatalog(profile?: WorkflowProfile): WorkflowPresetCatalogEntry[];
export declare function isWorkflowPresetKind(value: unknown): value is WorkflowPresetKind;
export declare function validateWorkflowPresetInput(input: {
    preset: WorkflowPresetKind;
    profile: WorkflowProfile;
    config: unknown;
}): WorkflowPresetValidationIssue[];
export declare function parseWorkflowPresetConfig(value: unknown): WorkflowPresetConfig;
