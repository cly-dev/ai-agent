import type { ToolLevel } from '../../../../../generated/prisma/client';
import type {
  PageContextPlanKind,
  PageContextUsage,
} from '../../../host-bridge/page-context-usage.types';
import type { AgentChatPageContext } from '../../../host-bridge/page-context.types';
import type { SkillExecutionChannels } from '../../../workflow/derive-skill-execution-channels.util';
import type { TurnRespondRequest } from './turn-respond.types';
import type { TurnRouteDraft, TurnRouteMeta } from './turn-routing.types';
import type { SkillIntentAlignmentSnapshot } from './skill-intent-alignment.types';
import type { TurnScopedToolsSource } from './turn-scoped-tools.util';
import type { TurnTaskKind } from './turn-task-kind.types';

/** 外层 Plan 如何选中 Skill（由 Turn 契约决定，非运行时推断）。 */
export type TurnPlanSkillSelect = 'llm' | 'explicit' | 'page_host';

export type TurnPlanExecutionPolicy = {
  enabled: boolean;
  scopedToolsSource: TurnScopedToolsSource;
  skillSelect: TurnPlanSkillSelect;
  explicitSkillId: number | null;
  pageHostSkillId: number | null;
  allowHostToolSteps: boolean;
  allowHostToolAutoDispatch: boolean;
  allowHostToolLlmDispatch: boolean;
  allowSessionResume: boolean;
  abandonActiveTaskOnFreshPlan: boolean;
  pageContextUsage: PageContextUsage;
  pageContextPlan: PageContextPlanKind;
};

/**
 * 本轮 Turn 唯一执行契约：respond / plan / host_tool / resume 均只读此对象。
 * route / writeChannel 由 taskKind 推导，不重复存储。
 */
export type TurnExecutionContract = {
  taskKind: TurnTaskKind;
  routeMeta: TurnRouteMeta;
  /** reconcile 是否将 LLM host 草稿锚定到 http（显式 Skill + 双通道/纯 mutation 时）。 */
  skillChannelAnchored: boolean;
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
  flowId?: number | null;
  flowVersion?: number | null;
  riskLevel?: ToolLevel;
  executionChannels: SkillExecutionChannels;
  config?: unknown;
};

export type BuildTurnExecutionContractInput = {
  routeDraft: TurnRouteDraft;
  userMessage: string;
  toolsEnabled: boolean;
  requestedSkillId: number | null;
  requestedSkill: BuildTurnExecutionContractRequestedSkill | null;
  pageHostCandidateId: number | null;
  pageContext: AgentChatPageContext | null;
};
