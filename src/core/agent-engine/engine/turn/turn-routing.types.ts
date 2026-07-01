import type { SkillExecutionChannels } from '../../../workflow/derive-skill-execution-channels.util';
import type { TurnWriteChannel } from './turn-write-channel.types';
import type {
  PageContextTaskKind,
  TurnPageReadKind,
} from '../../../host-bridge/page-context-usage.types';

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
  /** 读路径最终态；写意图时由 finalizeTurnRoutingDecision 压制为 none。 */
  pageContextTaskKind: TurnPageReadKind;
  /** Route LLM 原始 pageContextTaskKind（可含 mutation）。 */
  llmPageContextTaskKind: PageContextTaskKind;
  /** 写路径通道（route LLM + 结构化兜底；skill 锚定前为 draft）。 */
  llmWriteChannel: TurnWriteChannel;
  /** @deprecated 派生字段：llmWriteChannel === 'host'；保留供 host_tool policy 与审计兼容。 */
  hostMutationIntent: boolean;
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
  /** 显式 Skill 的 Workflow 推导通道（供 route LLM 参考，非强制）。 */
  requestedSkillExecutionChannels?: SkillExecutionChannels | null;
};
