export type HostMutationRunStep = {
    type: string;
    name?: string;
    input?: Record<string, unknown> | string;
    meta?: {
        executionStatus?: 'SUCCESS' | 'EMPTY' | 'ERROR';
        llmArguments?: Record<string, unknown>;
    };
};
export type HostMutationScopedTool = {
    name: string;
    agentMetadata: unknown;
};
