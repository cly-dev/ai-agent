/** Turn 级路由：本轮是否走页内 Skill / 编排 Plan / 直接作答。 */
export type TurnRouteKind =
  | 'direct_answer'
  | 'on_page_task'
  | 'orchestrated_task';

export type TurnRoutingMethod =
  | 'llm'
  | 'fallback_orchestrated';

export type TurnRoutingDecision = {
  route: TurnRouteKind;
  method: TurnRoutingMethod;
  reason: string;
  suggestedSkillId: number | null;
};

export type TurnRouteLlmInput = {
  userMessage: string;
  pageContext: Record<string, unknown> | null;
  intentRecallMatches: Array<{ id: number; label: string; score: number }>;
  availableSkills: Array<{
    id: number;
    name: string;
    description: string | null;
  }>;
  availableHostTools: Array<{ name: string; description: string }>;
  pageHostSkillCandidate: { id: number; name: string } | null;
  /** C 端显式点选 Skill 时传入；仍须结合 userMessage 判定 route。 */
  requestedSkill: { id: number; name: string; description: string | null } | null;
};
