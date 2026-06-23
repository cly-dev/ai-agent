import type { DynamicStructuredTool } from '@langchain/core/tools';
import type { AgentRunStatus, ToolLevel } from '../../../../../../generated/prisma/client';
import type { ToolExecutionDefinition } from '../../../../tool-engine/tool-engine.service';
import type { BuiltLangChainTools } from '../../../../tool-engine/tool-engine.service';
import type { LlmChatMessage } from '../../../../llm/llm.types';
import type { LlmObservationPayload } from '../../observation-format.util';
import type { AgentMachineCode } from '../../agent-run-user-messages.util';
import type { ToolResponseProfile } from '../../../../tool-engine/tool-response-profile.types';
import type { RunMetricsAccumulator } from '../../run-metrics.util';
import type { ToolBuildContext } from '../../../../tool-engine/tool-engine.service';
import type { ToolErrorDisposition, ToolExecutionStatus } from '../../tool/tool-execution-status.util';
import type { PlanRunContext } from '../plan/plan-observation-scope.util';
import type { TaskPlanSnapshot } from '../plan/task-plan.types';
import type { ToolHttpRequestLayout } from '../../../../tool-engine/tool-http-request-layout.util';
import type { PendingRespond } from '../../turn/turn-respond.types';
import type { TurnRoutingDecision } from '../../turn/turn-routing.types';
import type { TurnExecutionContract } from '../../turn/turn-execution-contract.types';
import type { HostToolDecisionDefinition } from '../../../../host-bridge/host-tool-decision.types';
import type { AgentChatPageContext } from '../../../../host-bridge/page-context.types';

export type AgentRunInput = {
  userId: number;
  sessionId: string;
  input: string;
  userMessageId: number;
  /** C 端用户指定的 Skill；外层 Plan 固定进入该 Skill。 */
  requestedSkillId?: number;
  /** 宿主页面上下文（omnix-chat pageContext）。 */
  pageContext?: AgentChatPageContext | null;
};

export type ResumeAfterWriteConfirmInput = {
  userId: number;
  sessionId: string;
  userMessageId?: number;
  /** 写确认消息可附带最新 pageContext（优先于 gate 时缓存）。 */
  pageContext?: AgentChatPageContext | null;
};

export type AgentRunStepType =
  | 'skill'
  | 'plan'
  | 'plan_sync'
  | 'route_plan'
  | 'intent'
  | 'readiness'
  | 'llm'
  | 'tool'
  | 'write_confirmation_gate'
  | 'gather'
  | 'result_check'
  | 'summarize'
  | 'host_tool';

export type AgentRunStep = {
  step: number;
  type: AgentRunStepType;
  name?: string;
  input?: Record<string, unknown> | string;
  output?: Record<string, unknown> | string;
  meta?: {
    prompt?: string;
    agentPrompt?: string;
    userRequest?: string;
    model?: string;
    latency?: number;
    quality?: 'high' | 'medium' | 'low';
    code?: AgentMachineCode;
    executionStatus?: 'SUCCESS' | 'EMPTY' | 'ERROR';
    attempt?: number;
    errorDisposition?: 'retry' | 'llm' | 'summarize';
    /** LLM 原始 tool_call arguments（normalize 后、HTTP 执行前）。 */
    llmArguments?: Record<string, unknown>;
    /** 经 responseProfile 投影后供 LLM 消费的观测结果。 */
    observationOutput?: Record<string, unknown> | string;
    /** HTTP 请求路径与各 `in` 参数分布（header / path / query / body）。 */
    httpRequest?: ToolHttpRequestLayout;
    responseSource?: unknown;
    /** 规则版 reflect_memory：summarize 采用的 obs 范围。 */
    memoryScope?: {
      primarySource: string;
      reason: string;
      filterMiss?: boolean;
      workingMemoryCount?: number;
      currentRunCount?: number;
    };
  };
};

/** 运行期 scoped 工具：含 HTTP 执行字段与 responseProfile，全程存于 graph state。 */
export type AgentEngineTool = ToolExecutionDefinition & {
  toolCategoryId: number | null;
  riskLevel: ToolLevel;
  responseProfile: unknown;
  agentMetadata: unknown;
};

export type ParsedIntentPayload = {
  intentClear: boolean;
  guidance: string;
  matchedCategoryIds: number[];
  includeUncategorized: boolean;
};

export type AgentRunResult = {
  runId: number;
  turnId: number;
  output: string;
  status: AgentRunStatus;
};

export type ScopedToolsResult = {
  scopedTools: AgentEngineTool[];
  scopedLangChainTools: DynamicStructuredTool[];
  scopedToolBundle: BuiltLangChainTools;
  scopedAllowedToolIds: number[];
  bindCap?: Record<string, unknown>;
  fallbackReason?: 'bind_recall_error' | 'bind_recall_empty';
};

export type CachedScopedToolsEntry = ScopedToolsResult & {
  toolFingerprint: string;
  expiresAt: number;
};

export const SESSION_TOOL_CACHE_TTL_MS = 10 * 60 * 1000;
export const MAX_SESSION_TOOL_CACHE_ENTRIES = 256;

export type GraphToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

export type ToolObservation = {
  name: string;
  output: unknown;
  llmPayload?: LlmObservationPayload;
  quality?: 'high' | 'medium' | 'low';
  fieldLabels?: Record<string, string>;
  fieldDescriptions?: Record<string, string>;
  enumLabelsByPath?: Record<string, Record<string, string>>;
};

export type AgentGraphState = {
  iteration: number;
  steps: AgentRunStep[];
  /** 本 run 新增的工具观测（不含 GOA / 写确认预载）。 */
  toolObservations: ToolObservation[];
  /** 图启动时从 GOA 或写确认上下文注入的历史观测。 */
  preloadedToolObservations?: ToolObservation[];
  pendingToolCalls: GraphToolCall[];
  /** 待 respond 节点处理：回合层反问或 execute 产出观测。 */
  pendingRespond: PendingRespond | null;
  intentKind: 'task' | 'smalltalk' | 'unclear';
  finalOutput: string;
  status: AgentRunStatus;
  finished: boolean;
  scopedTools: AgentEngineTool[];
  scopedLangChainTools: DynamicStructuredTool[];
  scopedAllowedToolIds: number[];
  scopedToolBundle: BuiltLangChainTools | null;
  toolProfilesByName: Record<string, ToolResponseProfile | null>;
  hasExpandedOnce: boolean;
  awaitingWriteConfirmation?: boolean;
  /** skill 节点命中后为 true，跳过 intent / llm 内 bind 收窄。 */
  skillApplied?: boolean;
  activeSkillId?: number | null;
  activeSkillPrompt?: string | null;
  activeSkillName?: string | null;
  activeSkillDescription?: string | null;
  activeSkillConfig?: unknown;
  activeSkillRiskLevel?: ToolLevel | null;
  /** Plan 节点产出；ReAct 循环按 currentObjective 推进。 */
  taskPlan?: TaskPlanSnapshot | null;
  /** tools 节点执行后供 resultCheck 消费，post_tools 判定后清空。 */
  lastToolRoundMeta?: {
    toolCalls: GraphToolCall[];
    executionStatuses: ToolExecutionStatus[];
    errorDispositions: ToolErrorDisposition[];
    roundObservationIndices: number[];
  } | null;
  /** 本 turn 引擎驱动分页 HTTP 累计次数（expand/resume loop）。 */
  pagedListHttpUsed?: number;
  /** Plan 因工具终态失败或 400 同参重试耗尽而中止；写入 GOA 时清除 activeTask。 */
  planAborted?: boolean;
  /**
   * 本 turn 运行上下文：session / 写确认续跑为 resume（telemetry、plan 首步 summarize 放行）。
   * gather 跳步始终仅认本 run toolObservations。
   */
  planRunContext?: PlanRunContext;
  /** 写确认续跑：gate 时固化的 primary present 草稿（artifact 序列化）。 */
  confirmedPreviewSerialized?: string | null;
  /** 本 turn 用户消息附带的宿主页面上下文。 */
  pageContext?: AgentChatPageContext | null;
  /** 当前 page scope 下可供 Plan/决策 LLM 使用的 Host Tool 元数据。 */
  scopedHostTools?: HostToolDecisionDefinition[];
  /** bindTools 用 Host Tool stub（执行在浏览器）。 */
  scopedHostLangChainTools?: DynamicStructuredTool[];
  /** route_plan 节点产出：本轮任务路由（direct_answer / on_page_task / orchestrated_task）。 */
  turnRoutingDecision?: TurnRoutingDecision | null;
  /** 本轮唯一执行契约（plan / host_tool / resume 只读此对象）。 */
  turnExecutionContract?: TurnExecutionContract | null;
};

export type AgentLangGraphRunInput = {
  promptMessages: LlmChatMessage[];
  latestUserMessage: string;
  sessionId: string;
  runId: number;
  userId: number;
  appClientId: number;
  agentId: number;
  maxSteps: number;
  enableToolCall: boolean;
  tools: AgentEngineTool[];
  langChainTools: BuiltLangChainTools;
  toolBuildCtx: ToolBuildContext;
  allowedToolIds: number[];
  messageTokenBudget: number;
  runMetrics: RunMetricsAccumulator;
  toolProfilesByName: Record<string, ToolResponseProfile | null>;
  turnId: number;
  resumeFromLlm?: boolean;
  /** 写确认续跑：跳过 skill/plan/llm，从 resultCheck 或 summarize 接续 Plan */
  resumeFromWriteConfirm?: boolean;
  graphInitialState?: Partial<AgentGraphState>;
  approvedWriteToolNames?: string[];
  /** C 端用户指定的 Skill；外层 Plan 固定进入该 Skill。 */
  requestedSkillId?: number;
  /** 宿主页面上下文（omnix-chat pageContext）。 */
  pageContext?: AgentChatPageContext | null;
};
