import type { WorkflowActionKind } from './workflow.types';
export type WorkflowFetchCompleteWhen = 'first_success' | 'fetch_all_pages';
export type WorkflowSummarizeMode = 'brief' | 'detailed' | 'draft' | 'final';
export type LoadPageContextNodeInput = {
    materialize?: boolean;
};
export type DetectCluesNodeInput = {
    hint?: string;
};
export type SummarizeImagesFrom = 'upstream' | 'page_context' | 'all';
export type SummarizeImagesOnFailure = 'degrade' | 'fail';
export type SummarizeImagesNodeInput = {
    from?: SummarizeImagesFrom;
    maxCells?: number;
    maxGroups?: number;
    maxCellsPerGroup?: number;
    cellPx?: number;
    hint?: string;
    onFailure?: SummarizeImagesOnFailure;
    cacheTtlSec?: number;
};
export type FetchDataNodeInput = {
    toolIds?: number[];
    toolId?: number;
    definitionKey?: string;
    completeWhen?: WorkflowFetchCompleteWhen;
};
export type GenerateAndPushNodeInput = {
    hostToolIds?: number[];
    hostToolId?: number;
};
export type SummarizeNodeInput = {
    mode?: WorkflowSummarizeMode;
    stream?: boolean;
    hostToolId?: number;
};
export type ComposeMutationNodeInput = {
    toolId: number;
};
export type PresentMutationNodeInput = {
    mode?: 'brief' | 'detailed';
};
export type WriteDataNodeInput = {
    toolId: number;
    useComposedArgs?: boolean;
};
export type AwaitUserConfirmNodeInput = {
    confirmKind?: 'mutation' | 'generic';
};
export type WorkflowNodeInputByAction = {
    load_page_context: LoadPageContextNodeInput;
    detect_clues: DetectCluesNodeInput;
    fetch_data: FetchDataNodeInput;
    summarize_images: SummarizeImagesNodeInput;
    generate_and_push: GenerateAndPushNodeInput;
    summarize: SummarizeNodeInput;
    compose_mutation: ComposeMutationNodeInput;
    present_mutation: PresentMutationNodeInput;
    write_data: WriteDataNodeInput;
    await_user_confirm: AwaitUserConfirmNodeInput;
};
export type WorkflowNodeInput = WorkflowNodeInputByAction[WorkflowActionKind];
