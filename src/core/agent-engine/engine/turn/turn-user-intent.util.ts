import type { AgentChatPageContext } from '../../../host-bridge/page-context.types';
import type { PageContextTaskKind } from '../../../host-bridge/page-context-usage.types';
import {
  assessPageContextData,
  resolveEffectivePageContextApplies,
} from '../../../host-bridge/page-context-usage.util';
import { resolveCanonicalTurnRoute } from '../../../host-bridge/page-context-execution-policy.util';
import type { TurnPageReadIntent, TurnPageReadKind } from './turn-user-intent.types';
import type {
  TurnRouteKind,
  TurnRoutingMethod,
} from './turn-routing.types';

function defaultPageReadKindOnFallback(input: {
  method: TurnRoutingMethod;
  pageContext: AgentChatPageContext | null | undefined;
  llmTaskKind: PageContextTaskKind;
}): TurnPageReadKind {
  if (input.llmTaskKind === 'mutation') {
    return 'none';
  }
  if (input.llmTaskKind === 'analyze' || input.llmTaskKind === 'answer') {
    return input.llmTaskKind;
  }
  const assessment = assessPageContextData(input.pageContext);
  if (assessment.dataSufficiency !== 'inline') {
    return 'none';
  }
  if (input.method === 'fallback_orchestrated') {
    return 'analyze';
  }
  return 'none';
}

function normalizePageReadKindWhenApplies(input: {
  applies: boolean;
  kind: TurnPageReadKind;
  pageContext: AgentChatPageContext | null | undefined;
}): TurnPageReadKind {
  if (!input.applies) {
    return 'none';
  }
  if (input.kind !== 'none') {
    return input.kind;
  }
  const assessment = assessPageContextData(input.pageContext);
  if (assessment.dataSufficiency === 'inline') {
    return 'analyze';
  }
  return 'none';
}

/** 读路径：用户是否消费页上内联/实体数据，以及如何消费。 */
export function resolveTurnPageReadIntent(input: {
  route: TurnRouteKind;
  method: TurnRoutingMethod;
  llmPageContextApplies: boolean;
  llmPageContextTaskKind: PageContextTaskKind;
  pageContext: AgentChatPageContext | null | undefined;
}): TurnPageReadIntent {
  const fallbackKind = input.llmPageContextApplies
    ? defaultPageReadKindOnFallback({
        method: input.method,
        pageContext: input.pageContext,
        llmTaskKind: input.llmPageContextTaskKind,
      })
    : 'none';

  const draftRoute = resolveCanonicalTurnRoute({
    llmRoute: input.route,
    pageContextTaskKind: fallbackKind,
  });

  const applies = resolveEffectivePageContextApplies({
    route: draftRoute,
    method: input.method,
    pageContextApplies: input.llmPageContextApplies,
    pageContext: input.pageContext,
  });

  const kind = normalizePageReadKindWhenApplies({
    applies,
    kind: applies ? fallbackKind : 'none',
    pageContext: input.pageContext,
  });

  return { applies, kind };
}
