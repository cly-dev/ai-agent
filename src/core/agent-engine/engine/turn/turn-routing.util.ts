import type { TurnRouteLlmInput, TurnRoutingDecision } from './turn-routing.types';

/** turn route LLM 失败时保守回退：不猜测 on_page_task，避免误触发页面 host 工作流。 */
export function buildTurnRouteFallbackDecision(input: {
  reason: string;
}): TurnRoutingDecision {
  return {
    route: 'orchestrated_task',
    method: 'fallback_orchestrated',
    reason: input.reason,
    suggestedSkillId: null,
  };
}

export function buildTurnRouteLlmUserPayload(
  input: TurnRouteLlmInput,
): string {
  return JSON.stringify(
    {
      userMessage: input.userMessage.trim(),
      pageContext: input.pageContext,
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
