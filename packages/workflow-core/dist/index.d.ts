export type WorkflowNodeAction = 'fetch_data' | 'generate_and_push' | 'summarize' | 'present_mutation' | 'write_data' | 'await_user_confirm';
export type WorkflowBindingRefs = {
    toolIds: number[];
    hostToolIds: number[];
};
export declare const WORKFLOW_CORE_PACKAGE = "@omnix/workflow-core";
