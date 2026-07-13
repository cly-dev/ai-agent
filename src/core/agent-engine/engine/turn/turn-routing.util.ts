import type { AgentChatPageContext } from '../../../host-bridge/page-context.types';
import { buildPageContextRouteHint } from '../../../host-bridge/page-context-usage.util';
import {
  DEFAULT_TURN_READ_DELIVERABLE,
  type TurnRouteDraft,
  type TurnRouteLlmInput,
} from './turn-routing.types';

/** 寒暄 / direct_answer：不经 route LLM，走 chitchat plan → workflow_react → llm。 */
export function buildChitchatRouteDraft(input: {
  reason: string;
}): TurnRouteDraft {
  return {
    route: 'direct_answer',
    method: 'fallback_orchestrated',
    reason: input.reason,
    suggestedSkillId: null,
    pageContextApplies: false,
    llmPageContextTaskKind: 'none',
    readDeliverable: DEFAULT_TURN_READ_DELIVERABLE,
    draftWriteChannel: 'none',
  };
}

/** turn route LLM 失败时保守回退；执行域由后续 plan/candidate recall 决定。 */
export function buildTurnRouteFallbackDraft(input: {
  reason: string;
}): TurnRouteDraft {
  return {
    route: 'orchestrated_task',
    method: 'fallback_orchestrated',
    reason: input.reason,
    suggestedSkillId: null,
    pageContextApplies: false,
    llmPageContextTaskKind: 'none',
    readDeliverable: DEFAULT_TURN_READ_DELIVERABLE,
    draftWriteChannel: 'none',
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
