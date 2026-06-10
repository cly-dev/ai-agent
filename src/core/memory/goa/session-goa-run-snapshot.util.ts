import { toStoredTaskPlan } from '../../agent-engine/engine/main/session-graph-resume.util';
import type { AgentGraphState } from '../../agent-engine/engine/main/agent-engine.types';
import type {
  ActiveTaskStatus,
  AgentRunGoaSnapshot,
  StoredTaskPlan,
} from './session-goa.types';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function isStoredTaskPlan(value: unknown): value is StoredTaskPlan {
  const row = asRecord(value);
  if (!row || !Array.isArray(row.steps) || row.steps.length === 0) {
    return false;
  }
  return typeof row.goal === 'string' && typeof row.originalUserRequest === 'string';
}

export function buildAgentRunGoaSnapshot(input: {
  graphState: Pick<
    AgentGraphState,
    'taskPlan' | 'intentKind' | 'awaitingWriteConfirmation' | 'status'
  >;
  runFailed?: boolean;
}): AgentRunGoaSnapshot | null {
  if (!input.graphState.taskPlan) {
    return null;
  }
  const storedTaskPlan = toStoredTaskPlan(input.graphState.taskPlan);
  let activeTaskStatus: ActiveTaskStatus = 'in_progress';
  if (input.graphState.awaitingWriteConfirmation) {
    activeTaskStatus = 'awaiting_confirmation';
  } else if (input.runFailed) {
    activeTaskStatus = 'failed';
  } else if (storedTaskPlan.pendingStepIds.length === 0) {
    activeTaskStatus = 'completed';
  }

  return {
    storedTaskPlan,
    activeTaskStatus,
    intentKind: input.graphState.intentKind,
    awaitingWriteConfirmation:
      input.graphState.awaitingWriteConfirmation === true,
    capturedAt: new Date().toISOString(),
  };
}

export function parseAgentRunGoaSnapshot(
  value: unknown,
): AgentRunGoaSnapshot | null {
  const row = asRecord(value);
  if (!row || !isStoredTaskPlan(row.storedTaskPlan)) {
    return null;
  }
  const status = row.activeTaskStatus;
  const activeTaskStatus: ActiveTaskStatus =
    status === 'in_progress' ||
    status === 'awaiting_confirmation' ||
    status === 'completed' ||
    status === 'failed' ||
    status === 'abandoned'
      ? status
      : 'in_progress';
  const intentKind = row.intentKind;
  return {
    storedTaskPlan: row.storedTaskPlan,
    activeTaskStatus,
    ...(intentKind === 'task' ||
    intentKind === 'smalltalk' ||
    intentKind === 'unclear'
      ? { intentKind }
      : {}),
    awaitingWriteConfirmation: row.awaitingWriteConfirmation === true,
    ...(typeof row.capturedAt === 'string' ? { capturedAt: row.capturedAt } : {}),
  };
}

export function isResumableGoaSnapshot(snapshot: AgentRunGoaSnapshot): boolean {
  if (snapshot.activeTaskStatus === 'awaiting_confirmation') {
    return true;
  }
  if (
    snapshot.activeTaskStatus !== 'in_progress' &&
    snapshot.activeTaskStatus !== 'failed'
  ) {
    return false;
  }
  return (snapshot.storedTaskPlan?.pendingStepIds.length ?? 0) > 0;
}
