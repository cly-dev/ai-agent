import type { SkillExecutionChannels } from '../../../workflow/derive-skill-execution-channels.util';
import type {
  PageContextTaskKind,
  TurnPageReadKind,
} from '../../../host-bridge/page-context-usage.types';

/** Turn 级路由：本轮是否走页内 Skill / 编排 Plan / 直接作答。 */
export type TurnRouteKind =
  | 'direct_answer'
  | 'on_page_task'
  | 'orchestrated_task';

/** orchestrated_read Plan 模板：单页列表 vs 全量拉取+分析。 */
export type TurnReadDeliverable = 'list' | 'analysis';

export const DEFAULT_TURN_READ_DELIVERABLE: TurnReadDeliverable = 'analysis';

export type TurnRoutingMethod =
  | 'llm'
  | 'fallback_orchestrated';

/**
 * Route LLM 原始草稿（未经 pageContext 评估与 TaskKind 校正）。
 */
export type TurnRouteDraft = {
  route: TurnRouteKind;
  method: TurnRoutingMethod;
  reason: string;
  suggestedSkillId: number | null;
  pageContextApplies: boolean;
  llmPageContextTaskKind: PageContextTaskKind;
  readDeliverable: TurnReadDeliverable;
  draftWriteChannel: import('./turn-write-channel.types').TurnWriteChannel;
};

/**
 * 不可由 taskKind 推导的路由元数据（契约内与 taskKind 并列存储，不重复 route/writeChannel）。
 */
export type TurnRouteMeta = {
  method: TurnRoutingMethod;
  reason: string;
  suggestedSkillId: number | null;
  pageContextApplies: boolean;
  pageContextTaskKind: TurnPageReadKind;
  llmPageContextTaskKind: PageContextTaskKind;
  readDeliverable: TurnReadDeliverable;
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
  requestedSkill: { id: number; name: string; description: string | null } | null;
  requestedSkillExecutionChannels?: SkillExecutionChannels | null;
};
