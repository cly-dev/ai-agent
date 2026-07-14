import type { WorkflowProfile } from './workflow.types';
export type WorkflowPresetKind = 'page_auto_fill' | 'page_context_push' | 'fetch_push_summarize' | 'fetch_and_answer' | 'mutation_submit' | 'page_context_mutation_submit';
export type WorkflowPresetObjectiveConfig = {
    loadPage?: string;
    fetch?: string;
    push?: string;
    compose?: string;
    present?: string;
    write?: string;
    summarize?: string;
};
export type WorkflowPresetConfig = {
    readToolId?: number;
    writeToolId?: number;
    hostToolId?: number;
    fetchCompleteWhen?: 'first_success' | 'fetch_all_pages';
    pushStream?: boolean;
    summarizeMode?: 'brief' | 'detailed' | 'final';
    presentMode?: 'brief' | 'detailed';
    confirmKind?: 'mutation' | 'generic';
    materializePageContext?: boolean;
    objectives?: WorkflowPresetObjectiveConfig;
};
export type WorkflowPresetCatalogEntry = {
    kind: WorkflowPresetKind;
    label: string;
    description: string;
    profiles: WorkflowProfile[];
    requiredConfig: Array<keyof WorkflowPresetConfig>;
    optionalConfig: Array<keyof WorkflowPresetConfig>;
    expandedActions: string[];
};
export type WorkflowPresetValidationIssue = {
    path: string;
    code: string;
    message: string;
};
