export type AgentChatPageContext = {
    page?: string;
    routePath?: string;
    routeParams?: Record<string, unknown>;
    flowId?: number;
    programName?: string;
    entity?: {
        type?: string;
        id?: string;
        [key: string]: unknown;
    };
    metadata?: Record<string, unknown>;
};
