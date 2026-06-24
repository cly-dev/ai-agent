import type { AgentChatPageContext } from '../../../host-bridge/page-context.types';
import {
  assessPageContextData,
  buildPageContextRouteHint,
  resolveEffectivePageContextApplies,
} from '../../../host-bridge/page-context-usage.util';
import { resolveCanonicalTurnRoute } from '../../../host-bridge/page-context-execution-policy.util';
import type { PageContextTaskKind } from '../../../host-bridge/page-context-usage.types';
import type {
  TurnRouteLlmInput,
  TurnRoutingDecision,
} from './turn-routing.types';

/** turn route LLM 失败时保守回退：不猜测 on_page_task，避免误触发页面 host 工作流。 */
export function buildTurnRouteFallbackDecision(input: {
  reason: string;
}): TurnRoutingDecision {
  return {
    route: 'orchestrated_task',
    method: 'fallback_orchestrated',
    reason: input.reason,
    suggestedSkillId: null,
    pageContextApplies: false,
    pageContextTaskKind: 'none',
  };
}

function defaultPageContextTaskKindOnFallback(input: {
  method: TurnRoutingDecision['method'];
  pageContext: AgentChatPageContext | null | undefined;
  llmTaskKind: PageContextTaskKind;
}): PageContextTaskKind {
  if (input.llmTaskKind !== 'none') {
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

function normalizePageContextTaskKindWhenApplies(input: {
  pageContextApplies: boolean;
  pageContextTaskKind: PageContextTaskKind;
  pageContext: AgentChatPageContext | null | undefined;
}): PageContextTaskKind {
  if (!input.pageContextApplies || input.pageContextTaskKind !== 'none') {
    return input.pageContextTaskKind;
  }
  const assessment = assessPageContextData(input.pageContext);
  if (assessment.dataSufficiency === 'inline') {
    return 'analyze';
  }
  return 'none';
}

/**
 * 合并 route LLM 输出 → 结构化不变式 → 最终 TurnRoutingDecision。
 * 顺序：draft taskKind → canonical route → applies → final taskKind → final route。
 */
export function finalizeTurnRoutingDecision(input: {
  decision: TurnRoutingDecision;
  pageContext: AgentChatPageContext | null | undefined;
}): TurnRoutingDecision {
  const llmReportedApplies = input.decision.pageContextApplies;

  const draftTaskKind = llmReportedApplies
    ? defaultPageContextTaskKindOnFallback({
        method: input.decision.method,
        pageContext: input.pageContext,
        llmTaskKind: input.decision.pageContextTaskKind,
      })
    : 'none';

  const draftRoute = resolveCanonicalTurnRoute({
    llmRoute: input.decision.route,
    pageContextTaskKind: draftTaskKind,
  });

  const pageContextApplies = resolveEffectivePageContextApplies({
    route: draftRoute,
    method: input.decision.method,
    pageContextApplies: llmReportedApplies,
    pageContext: input.pageContext,
  });

  const pageContextTaskKind = normalizePageContextTaskKindWhenApplies({
    pageContextApplies,
    pageContextTaskKind: pageContextApplies
      ? defaultPageContextTaskKindOnFallback({
          method: input.decision.method,
          pageContext: input.pageContext,
          llmTaskKind: input.decision.pageContextTaskKind,
        })
      : 'none',
    pageContext: input.pageContext,
  });

  const route = resolveCanonicalTurnRoute({
    llmRoute: input.decision.route,
    pageContextTaskKind,
  });

  return {
    ...input.decision,
    route,
    pageContextApplies,
    pageContextTaskKind,
  };
}

export function buildTurnRouteLlmUserPayload(input: TurnRouteLlmInput): string {
  const pageContextHint = buildPageContextRouteHint(
    input.pageContext as AgentChatPageContext | null,
  );
  return JSON.stringify(
    {
      userMessage: input.userMessage.trim(),
      pageContext: input.pageContext,
      pageContextHint,
      intentRecallMatches: input.intentRecallMatches,
      availableSkills: input.availableSkills,
      availableHostTools: input.availableHostTools,
      pageHostSkillCandidate: input.pageHostSkillCandidate,
      requestedSkill: input.requestedSkill,
    },
    null,
    2,
  );
}
