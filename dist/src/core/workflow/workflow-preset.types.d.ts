import type { WorkflowProfile } from './workflow.types';
export type WorkflowPresetKind = 'page_auto_fill' | 'fetch_and_answer' | 'mutation_submit';
export type WorkflowPresetConfig = {
    readToolId?: number;
    writeToolId?: number;
    hostToolId?: number;
};
export type WorkflowPresetCatalogEntry = {
    kind: WorkflowPresetKind;
    label: string;
    description: string;
    profiles: WorkflowProfile[];
    requiredConfig: Array<keyof WorkflowPresetConfig>;
    optionalConfig: Array<keyof WorkflowPresetConfig>;
    expandedOperations: string[];
};
export type WorkflowPresetValidationIssue = {
    path: string;
    code: string;
    message: string;
};
