import {
  createEmptySessionGoaPayload,
  type ActiveTask,
  type ActiveTaskStatus,
  type ObservationEntry,
  type SessionArtifact,
  type SessionGoaPayload,
  type StoredTaskPlan,
  type TaskStepProgress,
  type TurnEpisode,
} from './session-goa.types';

/** 旧版 Redis blob 中的 GOA 字段（迁移用）。 */
export type LegacySessionContextPayload = {
  sessionId: string;
  turns: unknown[];
  workingMemory?: { entities?: Record<string, unknown> } | null;
  recentEpisodes?: unknown;
  sessionArtifacts?: unknown;
  taskState?: {
    turnId: number;
    runId: number;
    status: string;
    updatedAt?: string;
    steps?: Array<{
      stepId: string;
      phase: string;
      kind: string;
      status: TaskStepProgress['status'];
      summary?: string;
      artifactRef?: string;
    }>;
  } | null;
  resumeTaskPlan?: StoredTaskPlan | null;
  observationSnapshots?: unknown;
  updatedAt?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function migrateEpisodes(raw: unknown): TurnEpisode[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((row) => {
    const item = asRecord(row);
    return (
      item != null &&
      typeof item.turnId === 'number' &&
      typeof item.goal === 'string'
    );
  }) as TurnEpisode[];
}

function migrateArtifacts(raw: unknown): SessionArtifact[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((row) => {
    const item = asRecord(row);
    return item != null && typeof item.id === 'string';
  }) as SessionArtifact[];
}

function migrateObservationLog(raw: unknown): ObservationEntry[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const entries: ObservationEntry[] = [];
  for (const snapshot of raw) {
    const row = asRecord(snapshot);
    if (!row || !Array.isArray(row.observations)) {
      continue;
    }
    const runId = typeof row.runId === 'number' ? row.runId : 0;
    const turnId = typeof row.turnId === 'number' ? row.turnId : 0;
    const createdAt =
      typeof row.createdAt === 'string' ? row.createdAt : new Date().toISOString();
    for (const obs of row.observations) {
      const o = asRecord(obs);
      if (!o || typeof o.name !== 'string') {
        continue;
      }
      entries.push({
        runId,
        turnId,
        name: o.name,
        output: o.output,
        createdAt,
      });
    }
  }
  return entries;
}

function migrateActiveTask(legacy: LegacySessionContextPayload): ActiveTask | null {
  const resumePlan = legacy.resumeTaskPlan;
  const taskState = legacy.taskState;
  if (!resumePlan || !taskState) {
    return null;
  }
  const status = (taskState.status === 'in_progress'
    ? 'in_progress'
    : taskState.status === 'awaiting_confirmation'
      ? 'awaiting_confirmation'
      : taskState.status === 'failed'
        ? 'failed'
        : 'completed') as ActiveTaskStatus;

  const stepProgress = (taskState.steps ?? []).map((step) => ({
    stepId: step.stepId,
    phase: step.phase,
    kind: step.kind,
    status: step.status,
    summary: step.summary,
    artifactRef: step.artifactRef,
  })) as TaskStepProgress[];

  return {
    taskId: `task-${taskState.turnId}-${taskState.runId}`,
    status,
    plan: resumePlan,
    stepProgress,
    observationLog: migrateObservationLog(legacy.observationSnapshots),
    startedTurnId: taskState.turnId,
    lastTurnId: taskState.turnId,
    lastRunId: taskState.runId,
    updatedAt: taskState.updatedAt ?? new Date().toISOString(),
  };
}

/** 从旧版 Redis SessionContextPayload 提取 GOA 并转为新模型。 */
export function migrateLegacyContextToGoa(
  sessionId: string,
  legacy: LegacySessionContextPayload,
): SessionGoaPayload {
  const base = createEmptySessionGoaPayload(sessionId);
  return {
    ...base,
    recentEpisodes: migrateEpisodes(legacy.recentEpisodes),
    sessionArtifacts: migrateArtifacts(legacy.sessionArtifacts),
    activeTask: migrateActiveTask(legacy),
    entities: { ...(legacy.workingMemory?.entities ?? {}) },
    updatedAt: legacy.updatedAt ?? new Date().toISOString(),
  };
}
