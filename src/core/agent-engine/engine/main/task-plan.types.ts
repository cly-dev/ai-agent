import type { ToolLevel } from '../../../../../generated/prisma/client';
import type { ToolDecisionRole } from '../../../tool-engine/tool-decision-role.enum';

export type TaskPlanSummaryObservation = {
  name: string;
  output: unknown;
  llmPayload?: unknown;
  quality?: 'high' | 'medium' | 'low';
  fieldLabels?: Record<string, string>;
  fieldDescriptions?: Record<string, string>;
  enumLabelsByPath?: Record<string, Record<string, string>>;
};

export type TaskPlanSource = 'workflow' | 'llm' | 'template' | 'minimal';

export type TaskPlanResolveMethod = TaskPlanSource;

export type TaskDeliverable =
  | 'analysis'
  | 'list'
  | 'detail'
  | 'mutation'
  | 'answer';

/** 步骤执行方式：`tool` 走 ReAct 选工具；`summarize` 由 resultCheck 短路汇总；`reason` 预留纯文本推理。 */
export type TaskStepKind = 'tool' | 'summarize' | 'reason';

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
  toolRole?: ToolDecisionRole;
  objective: string;
  stopWhen?: TaskStepStopWhen;
};

/** Run 内可 JSON 序列化的 Plan 快照（Plan 节点写入，ReAct / resultCheck 推进）。 */
export type TaskPlanSnapshot = {
  source: TaskPlanSource;
  originalUserRequest: string;
  goal: string;
  deliverable: TaskDeliverable;
  constraints: string[];
  steps: TaskPlanStep[];
  pendingStepIds: string[];
  completedStepIds: string[];
  taskPhase: TaskStepPhase;
  currentObjective: string;
  currentStepId: string | null;
};

export type BuildTaskPlanInput = {
  userMessage: string;
  scopedToolSummaries: Array<{
    name: string;
    role: ToolDecisionRole;
  }>;
  skillApplied?: boolean;
  skillName?: string | null;
  skillDescription?: string | null;
  skillConfig?: unknown;
  /** L2/L3 通常含写操作，用于选择 mutation 模板 */
  skillRiskLevel?: ToolLevel | null;
};

export type TaskPlanInitialAdvanceResult = {
  updatedPlan: TaskPlanSnapshot;
  summaryObservation: TaskPlanSummaryObservation;
  reason: 'plan_initial_summarize';
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
};
