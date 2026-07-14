import type { AgentChatPageContext } from './page-context.types';
export declare function parsePageContextFromMessageFields(input: {
    pageContext?: unknown;
    page?: unknown;
    routePath?: unknown;
    routeParams?: unknown;
    flowId?: unknown;
    programName?: unknown;
    entity?: unknown;
    metadata?: unknown;
}): AgentChatPageContext | null;
