import type { ToolLevel } from '../../../../../generated/prisma/client';
import type {
  PageContextPlanKind,
  PageContextUsage,
} from '../../../host-bridge/page-context-usage.types';
import type { AgentChatPageContext } from '../../../host-bridge/page-context.types';
import type { SkillExecutionChannels } from '../../../workflow/derive-skill-execution-channels.util';
import type { TurnWriteChannel } from './turn-write-channel.types';
import type { TurnRespondRequest } from './turn-respond.types';
import type { TurnRoutingDecision } from './turn-routing.types';
import type { SkillIntentAlignmentSnapshot } from './skill-intent-alignment.types';
import type { TurnScopedToolsSource } from './turn-scoped-tools.util';

/** 外层 Plan 如何选中 Skill（由 Turn 契约决定，非运行时推断）。 */
export type TurnPlanSkillSelect = 'llm' | 'explicit' | 'page_host';

export type TurnPlanExecutionPolicy = {
  enabled: boolean;
  /** 本轮 HTTP scopedTools 来源（与 skillSelect 对齐，单一真相）。 */
  scopedToolsSource: TurnScopedToolsSource;
  skillSelect: TurnPlanSkillSelect;
  explicitSkillId: number | null;
  pageHostSkillId: number | null;
  /** 为 false 时 Skill 展开后跳过 workflow 中的 host_tool 步。 */
  allowHostToolSteps: boolean;
  allowHostToolAutoDispatch: boolean;
  allowHostToolLlmDispatch: boolean;
  allowSessionResume: boolean;
  /** 进入新 Plan 前是否放弃 activeTask（仅 fresh plan 路径）。 */
  abandonActiveTaskOnFreshPlan: boolean;
  /** 本轮 pageContext 消费策略（route 判定 + 结构化评估）。 */
  pageContextUsage: PageContextUsage;
  pageContextPlan: PageContextPlanKind;
};

/**
 * 本轮 Turn 唯一执行契约：respond / plan / host_tool / resume 均只读此对象。
 */
export type TurnExecutionContract = {
  routing: TurnRoutingDecision;
  terminalRespond: TurnRespondRequest | null;
  plan: TurnPlanExecutionPolicy;
  skillAlignment: SkillIntentAlignmentSnapshot;
};

export type BuildTurnExecutionContractRequestedSkill = {
  id: number;
  name: string;
  skillToolIds: number[];
  hostToolIds: number[];
  runnableKind: 'http' | 'host' | 'both';
  workflowId?: number | null;
  workflowVersion?: number | null;
  riskLevel?: ToolLevel;
  executionChannels: SkillExecutionChannels;
  config?: unknown;
};

export type BuildTurnExecutionContractInput = {
  routing: TurnRoutingDecision;
  userMessage: string;
  toolsEnabled: boolean;
  requestedSkillId: number | null;
  requestedSkill: BuildTurnExecutionContractRequestedSkill | null;
  effectiveWriteChannel: TurnWriteChannel;
  pageHostCandidateId: number | null;
  pageContext: AgentChatPageContext | null;
};
