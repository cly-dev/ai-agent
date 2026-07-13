import type { AgentChatPageContext } from './page-context.types';
import type { PageContextDataAssessment, PageContextUsage } from './page-context-usage.types';
export type PageContextMaterializedObservation = {
    name: string;
    output: unknown;
    llmPayload?: Record<string, unknown>;
};
export declare function assessPageContextData(pageContext: AgentChatPageContext | null | undefined): PageContextDataAssessment;
export declare function buildPageContextRouteHint(pageContext: AgentChatPageContext | null | undefined): Record<string, unknown> | null;
export declare function isPageContextSourcedObservation(input: {
    name: string;
    output?: unknown;
}): boolean;
export declare function readEntityIdFromPageContextObservation(output: unknown): string | null;
export declare function pageContextObservationMatchesEntity(input: {
    observation: {
        name: string;
        output?: unknown;
    };
    entityId: string | null | undefined;
}): boolean;
export declare function materializePageContextObservations(pageContext: AgentChatPageContext | null | undefined): PageContextMaterializedObservation[];
export declare function mergePageContextPreloadedObservations<T extends {
    name: string;
    output?: unknown;
}>(existing: T[], pageContext: AgentChatPageContext | null | undefined): T[];
export declare function resolveEffectivePageContextApplies(input: {
    route: 'direct_answer' | 'on_page_task' | 'orchestrated_task';
    method: 'llm' | 'fallback_orchestrated';
    pageContextApplies: boolean;
    pageContext: AgentChatPageContext | null | undefined;
}): boolean;
export declare function resolvePageContextEntityIdForPlanSatisfaction(input: {
    pageContextUsage?: Pick<PageContextUsage, 'applies' | 'entityId'> | null;
    pageContext?: AgentChatPageContext | null;
}): string | null;
