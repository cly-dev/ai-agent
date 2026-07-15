import type { ToolLevel } from '../../../../../../generated/prisma/client';
import type { ToolDecisionRole } from '../../../../tool-engine/tool-decision-role.enum';
import type { OuterPlanSkillSelectMethod } from './outer-plan-skill-resolve.util';
import type { PlanFrame } from './plan-stack.types';

export type TaskPlanSummaryObservation = {
  name: string;
  output: unknown;
  llmPayload?: unknown;
  quality?: 'high' | 'medium' | 'low';
  fieldLabels?: Record<string, string>;
  fieldDescriptions?: Record<string, string>;
  enumLabelsByPath?: Record<string, Record<string, string>>;
};

export type TaskPlanSource = 'workflow' | 'llm' | 'template' | 'minimal' | 'page_context';

export type TaskPlanResolveMethod = TaskPlanSource;

export type TaskDeliverable =
  | 'analysis'
  | 'list'
  | 'detail'
  | 'mutation'
  | 'answer';

/**
 * 步骤执行方式：
 * - `skill` 进入 skill 帧
 * - `tool` 走 HTTP ReAct
 * - `host_tool` 走 LLM→前端 Host Tool
 * - `summarize` / `reason` 文本生成
 * - `workflow_gate`：写确认门（await_user_confirm）
 * - `workflow_inline`：Workflow execute_node 内聚能力（如 summarize_images），**不进 ReAct**；
 *   不由 Plan LLM 自由推断，仅由 Workflow 资产 → Plan 镜像
 */
export type TaskStepKind =
  | 'skill'
  | 'tool'
  | 'host_tool'
  | 'summarize'
  | 'reason'
  | 'workflow_gate'
  | 'workflow_inline';

/** 任务阶段：`gather` 拉数、`analyze` 分析、`answer` 作答、`mutate` 写操作。 */
export type TaskStepPhase = 'gather' | 'analyze' | 'answer' | 'mutate';

export type TaskStepStopWhen =
  | 'observation_non_empty'
  | 'observation_fetch_complete'
  | 'observation_has_fields'
  | 'always';

export type TaskPlanStep = {
  id: string;
  phase: TaskStepPhase;
  kind: TaskStepKind;
  /** kind=skill 时必填：进入该 skill 并展开内层 steps。 */
  skillId?: number;
  toolRole?: ToolDecisionRole;
  /** kind=tool 时可选：plan 显式绑定的 HTTP 工具名（tool_resolve SSOT）。 */
  pinnedToolNames?: string[];
  /** kind=host_tool 时可选：限定可绑定的 Host Tool 名；空则使用当前 scope 下全部 LLM 暴露工具。 */
  hostToolNames?: string[];
  /** kind=host_tool 时可选：Workflow 节点声明的 HostTool ID 约束。 */
  hostToolIds?: number[];
  objective: string;
  stopWhen?: TaskStepStopWhen;
  /**
   * kind=workflow_inline 时：对应的 Workflow action（往返 compile 用）。
   * 第一期主要为 summarize_images。
   */
  workflowAction?: 'summarize_images';
};

/** Run 内可 JSON 序列化的 Plan 快照（Plan 栈 + 当前活跃帧投影）。 */
export type TaskPlanSnapshot = {
  source: TaskPlanSource;
  originalUserRequest: string;
  goal: string;
  deliverable: TaskDeliverable;
  constraints: string[];
  /** 当前活跃帧投影（与 frames[activeFrameIndex] 同步）。 */
  steps: TaskPlanStep[];
  pendingStepIds: string[];
  completedStepIds: string[];
  taskPhase: TaskStepPhase;
  currentObjective: string;
  currentStepId: string | null;
  frames: PlanFrame[];
  activeFrameIndex: number;
  /** 外层 Plan 如何选中 Skill（审计 / 门控）。 */
  outerSkillSelectMethod?: OuterPlanSkillSelectMethod;
  autoSelectedSkillId?: number | null;
};

export type PlanHostToolSummary = {
  id?: number;
  name: string;
  description: string;
};

export type BuildTaskPlanInput = {
  userMessage: string;
  scopedToolSummaries: Array<{
    name: string;
    role: ToolDecisionRole;
  }>;
  /** 当前 page scope 下可供 Plan LLM 编排的 Host Tool（Agent/Skill 绑定 + isActive）。 */
  availableHostTools?: PlanHostToolSummary[];
  skillApplied?: boolean;
  skillName?: string | null;
  skillDescription?: string | null;
  skillConfig?: unknown;
  /** L2/L3 通常含写操作，用于选择 mutation 模板 */
  skillRiskLevel?: ToolLevel | null;
  skillToolIds?: number[];
  skillHostToolIds?: number[];
};

export type TaskPlanInitialAdvanceResult = {
  updatedPlan: TaskPlanSnapshot;
  summaryObservation: TaskPlanSummaryObservation;
  reason: 'plan_initial_summarize';
};

/** Plan summarize 步 SSE / artifact 发布策略。 */
export type PlanSummarizePublishMode = {
  artifactPhase: 'draft' | 'final';
  /** false：仅 commit draft artifact，不发权威 stream.full（中间 reason 步）。 */
  emitAuthoritativeFull: boolean;
};

export type TaskPlanAdvanceResult = {
  updatedPlan: TaskPlanSnapshot;
  route: 'summarize' | 'llm';
  reason: string;
};

export type ResolveTaskPlanResult = {
  plan: TaskPlanSnapshot;
  method: TaskPlanResolveMethod;
  /** LLM 失败时规则兜底的原因码 */
  llmFallbackReason?: string;
  /** Plan LLM 产出但无可用 host tool 而被丢弃的步 id */
  droppedHostToolStepIds?: string[];
  /** 外层 Plan 如何选中 Skill（见 outer-plan-skill-resolve.util.ts） */
  outerSkillSelectMethod?: OuterPlanSkillSelectMethod;
  autoSelectedSkillId?: number | null;
};

export type PlanSessionEpisodeSummary = {
  turnId: number;
  runId: number;
  goal: string;
  outcome: string;
  status: string;
  toolsUsed: string[];
  artifactRefs: string[];
  metrics?: Record<string, string | number>;
  createdAt: string;
};

export type PlanSessionArtifactSummary = {
  id: string;
  turnId: number;
  kind: string;
  toolName?: string;
  stepId?: string;
  summary: string;
  meta?: Record<string, string | number>;
  createdAt: string;
};

export type PlanSessionObservationInventoryItem = {
  tool: string;
  runId: number;
  toolRole?: string;
  argsSummary: string;
  turnId: number;
  createdAt: string;
  rowCount?: number;
};

export type PlanSessionActiveTaskSummary = {
  status: string;
  goal: string;
  deliverable: string;
  originalUserRequest: string;
  pendingStepIds: string[];
  completedStepIds: string[];
  currentStepId: string | null;
  stepProgress: Array<{
    stepId: string;
    phase: string;
    kind: string;
    status: string;
    summary?: string;
    artifactRef?: string;
  }>;
};

/** Plan LLM user payload：会话 GOA 完整快照（与 SESSION_MEMORY_MAX_* 存储上限一致）。 */
export type PlanSessionWorkingMemory = {
  coverage: 'full_session_goa';
  storageLimits: {
    maxEpisodes: number;
    maxArtifacts: number;
    maxObservationLedgerEntries: number;
  };
  episodes: PlanSessionEpisodeSummary[];
  artifacts: PlanSessionArtifactSummary[];
  observationInventory: PlanSessionObservationInventoryItem[];
  satisfiedToolRoles: string[];
  entities?: Record<string, string>;
  activeTask?: PlanSessionActiveTaskSummary;
};

export type ResolveTaskPlanInput = BuildTaskPlanInput & {
  skillPrompt?: string | null;
  sessionWorkingMemory?: PlanSessionWorkingMemory | null;
  /** Skill.workflowId 绑定资产编译后的内层 plan；优先于 skill.config.workflow。 */
  skillBoundWorkflowPlan?: TaskPlanSnapshot | null;
};

export type OuterPlanSkillSummary = {
  id: number;
  name: string;
  description: string | null;
  capabilityKey: string | null;
  riskLevel: ToolLevel;
  toolRoles: ToolDecisionRole[];
  hostToolIds: number[];
  runnableKind: 'http' | 'host' | 'both';
};

export type ResolveOuterPlanInput = {
  userMessage: string;
  scopedToolSummaries: BuildTaskPlanInput['scopedToolSummaries'];
  availableHostTools?: PlanHostToolSummary[];
  availableSkills: OuterPlanSkillSummary[];
  sessionWorkingMemory?: PlanSessionWorkingMemory | null;
  /** 用户指定 Skill 时跳过外层 Plan LLM，直接编排单步 kind=skill。 */
  requestedSkillId?: number;
  /** 含 config 的完整 Skill 行；requestedSkillId 时用于 deliverable 等元数据。 */
  requestedSkillDetail?: {
    id: number;
    name: string;
    description: string | null;
    config: unknown;
    riskLevel: ToolLevel;
    skillToolIds?: number[];
    hostToolIds?: number[];
  };
};
