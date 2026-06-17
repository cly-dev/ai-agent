/** 会话 GOA 记忆类型（DB 权威；与 Redis session context 解耦）。 */

import type { AgentChatPageContext } from '../../host-bridge/page-context.types';

export type TurnEpisodeStatus = 'task' | 'smalltalk' | 'failed';

export type TurnEpisode = {
  turnId: number;
  runId: number;
  goal: string;
  outcome: string;
  status: TurnEpisodeStatus;
  toolsUsed: string[];
  metrics?: Record<string, string | number>;
  artifactRefs: string[];
  createdAt: string;
};

export type SessionArtifactKind = 'tool_result' | 'gather';

export type SessionArtifact = {
  id: string;
  turnId: number;
  runId: number;
  /** 与 StoredTaskPlan.steps[].id 显式绑定。 */
  stepId?: string;
  kind: SessionArtifactKind;
  toolName?: string;
  summary: string;
  meta?: Record<string, string | number>;
  createdAt: string;
};

export type TaskStepProgressStatus =
  | 'pending'
  | 'running'
  | 'done'
  | 'failed'
  | 'skipped';

export type TaskStepProgress = {
  stepId: string;
  phase: string;
  kind: string;
  status: TaskStepProgressStatus;
  summary?: string;
  artifactRef?: string;
};

export type ObservationEntry = {
  runId: number;
  turnId: number;
  name: string;
  output: unknown;
  createdAt: string;
  /** tool call 参数快照，用于会话 ledger 去重。 */
  args?: Record<string, unknown>;
};

/** 可 JSON 序列化的 Plan（与 TaskPlanSnapshot 互转，唯一持久化形态）。 */
export type StoredTaskPlanStep = {
  id: string;
  phase: string;
  kind: string;
  skillId?: number;
  toolRole?: string;
  objective: string;
  stopWhen?: string;
};

export type StoredPlanFrame = {
  frameId: string;
  skillId: number | null;
  skillName?: string | null;
  source: string;
  steps: StoredTaskPlanStep[];
  pendingStepIds: string[];
  completedStepIds: string[];
  taskPhase: string;
  currentObjective: string;
  currentStepId: string | null;
  parentSkillStepId?: string | null;
  skillPrompt?: string | null;
  skillDescription?: string | null;
  skillConfig?: unknown;
  skillRiskLevel?: string | null;
};

export type StoredTaskPlan = {
  source: string;
  originalUserRequest: string;
  goal: string;
  deliverable: string;
  constraints: string[];
  steps: StoredTaskPlanStep[];
  pendingStepIds: string[];
  completedStepIds: string[];
  taskPhase: string;
  currentObjective: string;
  currentStepId: string | null;
  frames?: StoredPlanFrame[];
  activeFrameIndex?: number;
};

/**
 * 活跃任务生命周期：
 * `in_progress` 执行中（新 userMessage 可经 session resume 评估续跑）；
 * `awaiting_confirmation` 写确认暂停（**仅**写确认 API → worker run 续跑；新 chat message 须 abandon）；
 * `completed` 步骤全部完成；
 * `failed` run 失败；
 * `abandoned` 用户切换意图后废弃（终态，不注入 prompt）。
 */
export type ActiveTaskStatus =
  | 'in_progress'
  | 'awaiting_confirmation'
  | 'completed'
  | 'failed'
  | 'abandoned';

/** 活跃任务：plan + 步骤进度 + 观测账本（替代 taskState/resumeTaskPlan/snapshots 三件套）。 */
export type ActiveTask = {
  taskId: string;
  status: ActiveTaskStatus;
  plan: StoredTaskPlan;
  stepProgress: TaskStepProgress[];
  observationLog: ObservationEntry[];
  startedTurnId: number;
  lastTurnId: number;
  lastRunId: number;
  updatedAt: string;
};

export type SessionGoaPayload = {
  sessionId: string;
  recentEpisodes: TurnEpisode[];
  sessionArtifacts: SessionArtifact[];
  /** 跨 turn 工具观测账本（任务结束后仍保留，供 preloadedToolObservations）。 */
  sessionObservationLedger: ObservationEntry[];
  activeTask: ActiveTask | null;
  /** 会话级实体（如 xShopId），非冗余 working memory。 */
  entities: Record<string, unknown>;
  /** 最近一次用户消息附带的宿主页面上下文（追问未带时回落）。 */
  lastPageContext?: AgentChatPageContext | null;
  updatedAt: string;
};

export type SessionMemoryRunStep = {
  type: string;
  name?: string;
  output?: unknown;
};

export type SessionMemoryUpdatePhase = 'full' | 'task_only';

/** AgentRun.goaSnapshot：run 结束时持久化，replay 权威来源。 */
export type AgentRunGoaSnapshot = {
  storedTaskPlan: StoredTaskPlan;
  activeTaskStatus: ActiveTaskStatus;
  intentKind?: 'task' | 'smalltalk' | 'unclear';
  awaitingWriteConfirmation?: boolean;
  capturedAt?: string;
};

export type SessionMemoryUpdateContext = {
  turnId: number;
  runId: number;
  userInput: string;
  finalOutput: string;
  /** 本 run 新增的工具观测（不含图预载）。 */
  newToolObservations: Array<{
    name: string;
    output: unknown;
    args?: Record<string, unknown>;
  }>;
  runSteps?: SessionMemoryRunStep[];
  storedTaskPlan?: StoredTaskPlan | null;
  runStatus?: 'success' | 'failed';
  intentKind?: 'task' | 'smalltalk' | 'unclear';
  /** 写确认暂停：只更新 activeTask，不写 episode。 */
  phase?: SessionMemoryUpdatePhase;
  awaitingWriteConfirmation?: boolean;
  /** 工具终态失败 / 同参重试耗尽：清除会话内未完成 activeTask。 */
  abandonActiveTask?: boolean;
};

export function createEmptySessionGoaPayload(sessionId: string): SessionGoaPayload {
  return {
    sessionId,
    recentEpisodes: [],
    sessionArtifacts: [],
    sessionObservationLedger: [],
    activeTask: null,
    entities: {},
    updatedAt: new Date().toISOString(),
  };
}

/** 读 DB / 缓存后补齐新字段，兼容旧 payload。 */
export function normalizeSessionGoaPayload(
  payload: SessionGoaPayload,
): SessionGoaPayload {
  return {
    ...payload,
    sessionObservationLedger: Array.isArray(payload.sessionObservationLedger)
      ? payload.sessionObservationLedger
      : [],
    lastPageContext: payload.lastPageContext ?? null,
  };
}

export function isSessionGoaPayload(value: unknown): value is SessionGoaPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    typeof row.sessionId === 'string' &&
    Array.isArray(row.recentEpisodes) &&
    Array.isArray(row.sessionArtifacts) &&
    (row.sessionObservationLedger === undefined ||
      Array.isArray(row.sessionObservationLedger)) &&
    (row.activeTask === null ||
      (typeof row.activeTask === 'object' && row.activeTask !== null)) &&
    typeof row.entities === 'object' &&
    row.entities !== null &&
    !Array.isArray(row.entities)
  );
}

export function isActiveTaskAwaitingWriteConfirmation(
  task: ActiveTask | null | undefined,
): boolean {
  return task?.status === 'awaiting_confirmation';
}

/** 新 userMessage 是否可走 session resume（不含写确认暂停）。 */
export function isActiveTaskChatResumable(
  task: ActiveTask | null | undefined,
): boolean {
  if (!task || task.status !== 'in_progress') {
    return false;
  }
  return task.stepProgress.some(
    (step) => step.status === 'pending' || step.status === 'running',
  );
}
