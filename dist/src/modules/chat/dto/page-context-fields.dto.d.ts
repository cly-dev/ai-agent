export declare class AgentChatPageContextDto {
    page?: string;
    routePath?: string;
    routeParams?: Record<string, unknown>;
    flowId?: number;
    programName?: string;
    entity?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}
export declare class PageContextMessageFieldsDto {
    pageContext?: AgentChatPageContextDto;
    page?: string;
    routePath?: string;
    routeParams?: Record<string, unknown>;
    flowId?: number;
    programName?: string;
    entity?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}
