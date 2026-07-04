import type { AgentChatPageContext } from '../../../host-bridge/page-context.types';
import type { PageContextTaskKind } from '../../../host-bridge/page-context-usage.types';
import type { TurnPageReadIntent } from './turn-user-intent.types';
import type { TurnRouteKind, TurnRoutingDecision, TurnRoutingMethod } from './turn-routing.types';
export declare function resolveTurnPageReadIntent(input: {
    route: TurnRouteKind;
    method: TurnRoutingMethod;
    llmPageContextApplies: boolean;
    llmPageContextTaskKind: PageContextTaskKind;
    pageContext: AgentChatPageContext | null | undefined;
}): TurnPageReadIntent;
export declare function finalizeTurnRoutingDecision(input: {
    decision: TurnRoutingDecision;
    pageContext: AgentChatPageContext | null | undefined;
}): TurnRoutingDecision;
