import type { AgentChatPageContext } from './page-context.types';
import type { PageContextPlanKind, PageContextUsage, TurnPageReadKind } from './page-context-usage.types';
export type TurnExecutionRoute = 'direct_answer' | 'on_page_task' | 'orchestrated_task';
export type PageContextExecutionPolicy = {
    usage: PageContextUsage;
    plan: PageContextPlanKind;
};
type PageContextWriteChannel = 'none' | 'http' | 'host';
export declare function resolvePageContextExecutionPolicy(input: {
    route: TurnExecutionRoute;
    pageContextApplies: boolean;
    pageContextTaskKind: TurnPageReadKind;
    pageContext: AgentChatPageContext | null | undefined;
    writeChannel?: PageContextWriteChannel;
    hostMutationIntent?: boolean;
}): PageContextExecutionPolicy;
export declare function resolveCanonicalTurnRoute(input: {
    llmRoute: TurnExecutionRoute;
    pageContextTaskKind: TurnPageReadKind;
}): TurnExecutionRoute;
export declare function shouldMaterializePageContextFromUsage(usage: Pick<PageContextUsage, 'applies' | 'dataSufficiency'>): boolean;
export declare function isPageContextOuterPlanActive(pageContextPlan: PageContextPlanKind): boolean;
export declare function hasPageContextMaterializedObservations(observations: Array<{
    name: string;
    output?: unknown;
}>): boolean;
export declare function planInitialSummarizeReadyOnFresh(input: {
    planSource: string;
    planConstraints: string[];
    runOwnedObservations: unknown[];
    allObservations: Array<{
        name: string;
        output?: unknown;
    }>;
}): boolean;
export {};
