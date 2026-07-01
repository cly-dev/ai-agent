import type { AgentChatPageContext } from '../../../host-bridge/page-context.types';
import { buildPageContextRouteHint } from '../../../host-bridge/page-context-usage.util';
import type { TurnRouteLlmInput, TurnRoutingDecision } from './turn-routing.types';

export { finalizeTurnRoutingDecision } from './turn-user-intent.util';

/** 寒暄 / direct_answer：不经 route LLM，走 chitchat plan → workflow_react → llm。 */
export function buildChitchatRoutingDecision(input: {
  reason: string;
}): TurnRoutingDecision {
  return {
    route: 'direct_answer',
    method: 'fallback_orchestrated',
    reason: input.reason,
    suggestedSkillId: null,
    pageContextApplies: false,
    pageContextTaskKind: 'none',
    llmPageContextTaskKind: 'none',
    llmWriteChannel: 'none',
    hostMutationIntent: false,
  };
}

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
    llmPageContextTaskKind: 'none',
    llmWriteChannel: 'none',
    hostMutationIntent: false,
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
      requestedSkillExecutionChannels: input.requestedSkillExecutionChannels,
    },
    null,
    2,
  );
}
