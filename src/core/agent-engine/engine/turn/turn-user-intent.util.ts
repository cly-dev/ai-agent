import type { AgentChatPageContext } from '../../../host-bridge/page-context.types';
import { resolveCanonicalTurnRoute } from '../../../host-bridge/page-context-execution-policy.util';
import type { PageContextTaskKind } from '../../../host-bridge/page-context-usage.types';
import {
  assessPageContextData,
  resolveEffectivePageContextApplies,
} from '../../../host-bridge/page-context-usage.util';
import type { TurnPageReadIntent, TurnPageReadKind } from './turn-user-intent.types';
import type {
  TurnRouteKind,
  TurnRoutingDecision,
  TurnRoutingMethod,
} from './turn-routing.types';
import {
  hostMutationIntentFromWriteChannel,
  type TurnWriteChannel,
} from './turn-write-channel.types';

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

function resolveDraftWriteChannelOnPageRoute(input: {
  route: TurnRouteKind;
  llmWriteChannel: TurnWriteChannel;
}): TurnWriteChannel {
  if (input.route === 'on_page_task' && input.llmWriteChannel === 'none') {
    return 'host';
  }
  return input.llmWriteChannel;
}

/** 读路径：页上内联/实体数据消费意图。 */
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

/** 写路径优先：读 plan kind 置 none，保留 applies 供 prompt / 物化 enrichment。 */
function suppressReadKindForWriteIntent(
  pageRead: TurnPageReadIntent,
): TurnPageReadIntent {
  return { applies: pageRead.applies, kind: 'none' };
}

/**
 * 合并 route LLM 草稿 → 结构化读/写意图 → 最终 TurnRoutingDecision。
 * 不变式：llmWriteChannel !== none 时，读 plan 不激活（pageContextTaskKind=none）。
 */
export function finalizeTurnRoutingDecision(input: {
  decision: TurnRoutingDecision;
  pageContext: AgentChatPageContext | null | undefined;
}): TurnRoutingDecision {
  const pageReadDraft = resolveTurnPageReadIntent({
    route: input.decision.route,
    method: input.decision.method,
    llmPageContextApplies: input.decision.pageContextApplies,
    llmPageContextTaskKind: input.decision.llmPageContextTaskKind,
    pageContext: input.pageContext,
  });

  const draftWriteChannel = resolveDraftWriteChannelOnPageRoute({
    route: input.decision.route,
    llmWriteChannel: input.decision.llmWriteChannel,
  });

  const pageRead =
    draftWriteChannel !== 'none'
      ? suppressReadKindForWriteIntent(pageReadDraft)
      : pageReadDraft;

  const route = resolveCanonicalTurnRoute({
    llmRoute: input.decision.route,
    pageContextTaskKind: pageRead.kind,
  });

  const llmWriteChannel = resolveDraftWriteChannelOnPageRoute({
    route,
    llmWriteChannel: draftWriteChannel,
  });

  return {
    ...input.decision,
    route,
    pageContextApplies: pageRead.applies,
    pageContextTaskKind: pageRead.kind,
    llmWriteChannel,
    hostMutationIntent: hostMutationIntentFromWriteChannel(llmWriteChannel),
  };
}
