import type { PageContextTaskKind } from '../../../host-bridge/page-context-usage.types';

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
  /** 用户是否在消费当前页 / 当前实体上下文（route LLM + 结构化兜底）。 */
  pageContextApplies: boolean;
  /** 用户想如何用页上内联数据；pageContextApplies=false 时应为 none。 */
  pageContextTaskKind: PageContextTaskKind;
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
