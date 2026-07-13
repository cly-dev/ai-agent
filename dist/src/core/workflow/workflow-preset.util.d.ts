import type { WorkflowPresetCatalogEntry, WorkflowPresetConfig, WorkflowPresetKind, WorkflowPresetValidationIssue } from './workflow-preset.types';
import type { WorkflowNodeDef, WorkflowProfile } from './workflow.types';
export declare const WORKFLOW_PRESET_CATALOG: WorkflowPresetCatalogEntry[];
export declare function listWorkflowPresetCatalog(_profile?: WorkflowProfile): WorkflowPresetCatalogEntry[];
export declare function isWorkflowPresetKind(value: unknown): value is WorkflowPresetKind;
export declare function validateWorkflowPresetInput(input: {
    preset: WorkflowPresetKind;
    profile: WorkflowProfile;
    config: unknown;
}): WorkflowPresetValidationIssue[];
export declare function expandWorkflowPreset(input: {
    preset: WorkflowPresetKind;
    profile: WorkflowProfile;
    config: WorkflowPresetConfig;
}): WorkflowNodeDef[];
export declare function parseWorkflowPresetConfig(value: unknown): WorkflowPresetConfig;
