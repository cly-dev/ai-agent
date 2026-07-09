import type { AgentChatPageContext } from './page-context.types';
export type PageContextInlineRecord = {
    kind: string;
    record: Record<string, unknown>;
};
export declare function buildPageContextObservationName(kind: string): string;
export declare function resolvePageContextEntityId(pageContext: AgentChatPageContext | null | undefined): string | null;
export declare function readInlineRecordsFromPageContext(pageContext: AgentChatPageContext): PageContextInlineRecord[];
