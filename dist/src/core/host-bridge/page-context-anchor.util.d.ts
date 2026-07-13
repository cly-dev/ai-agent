import type { AgentChatPageContext } from './page-context.types';
export type PageContextAnchor = {
    page: string | null;
    routePath: string | null;
    entityId: string | null;
    entityType: string | null;
};
export declare function assessPageContextAnchor(pageContext: AgentChatPageContext | null | undefined): PageContextAnchor;
export declare function resolveHostToolPageScope(pageContext: AgentChatPageContext | null | undefined): string | null;
export declare function canDispatchHostAction(input: {
    pageContext: AgentChatPageContext | null | undefined;
    hostPageScopes: Array<string | null | undefined>;
}): boolean;
