import {
  isResumableGoaSnapshot,
  parseAgentRunGoaSnapshot,
} from './session-goa-run-snapshot.util';
import type {
  ActiveTask,
  ActiveTaskStatus,
  AgentRunGoaSnapshot,
  ObservationEntry,
  StoredTaskPlan,
  TaskStepProgress,
} from './session-goa.types';

type ReplayTaskPlanTrace = {
  source: string;
  deliverable: string;
  goal: string;
  originalUserRequest: string;
  currentStepId: string | null;
  currentObjective: string;
  taskPhase: string;
  pendingStepIds: string[];
  completedStepIds: string[];
  steps: StoredTaskPlan['steps'];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((row): row is string => typeof row === 'string');
}

function parsePlanTrace(
  trace: Record<string, unknown>,
  originalUserRequest: string,
): ReplayTaskPlanTrace | null {
  const stepsRaw = trace.steps;
  if (!Array.isArray(stepsRaw) || stepsRaw.length === 0) {
    return null;
  }
  const steps: StoredTaskPlan['steps'] = [];
  for (const row of stepsRaw) {
    const step = asRecord(row);
    if (!step || typeof step.id !== 'string' || typeof step.objective !== 'string') {
      continue;
    }
    steps.push({
      id: step.id,
      phase: typeof step.phase === 'string' ? step.phase : 'answer',
      kind: typeof step.kind === 'string' ? step.kind : 'tool',
      ...(typeof step.toolRole === 'string' ? { toolRole: step.toolRole } : {}),
      objective: step.objective,
      ...(typeof step.stopWhen === 'string' ? { stopWhen: step.stopWhen } : {}),
    });
  }
  if (steps.length === 0) {
    return null;
  }
  return {
    source: typeof trace.source === 'string' ? trace.source : 'minimal',
    deliverable: typeof trace.deliverable === 'string' ? trace.deliverable : 'answer',
    goal: typeof trace.goal === 'string' ? trace.goal : originalUserRequest,
    originalUserRequest,
    currentStepId:
      typeof trace.currentStepId === 'string' ? trace.currentStepId : null,
    currentObjective:
      typeof trace.currentObjective === 'string'
        ? trace.currentObjective
        : steps[0]?.objective ?? originalUserRequest,
    taskPhase: typeof trace.taskPhase === 'string' ? trace.taskPhase : 'answer',
    pendingStepIds: asStringArray(trace.pendingStepIds),
    completedStepIds: asStringArray(trace.completedStepIds),
    steps,
  };
}

export function extractLatestTaskPlanTraceFromSteps(
  steps: unknown,
  originalUserRequest: string,
): ReplayTaskPlanTrace | null {
  if (!Array.isArray(steps)) {
    return null;
  }
  let latest: ReplayTaskPlanTrace | null = null;
  for (const row of steps) {
    const step = asRecord(row);
    if (!step || step.type !== 'llm') {
      continue;
    }
    const output = asRecord(step.output);
    const trace = output ? asRecord(output.taskPlanTrace) : null;
    if (!trace) {
      continue;
    }
    const parsed = parsePlanTrace(trace, originalUserRequest);
    if (parsed) {
      latest = parsed;
    }
  }
  return latest;
}

export function extractObservationLogFromRunSteps(input: {
  turnId: number;
  runId: number;
  steps: unknown;
}): ObservationEntry[] {
  if (!Array.isArray(input.steps)) {
    return [];
  }
  const entries: ObservationEntry[] = [];
  const now = new Date().toISOString();
  for (const row of input.steps) {
    const step = asRecord(row);
    if (!step || step.type !== 'tool' || typeof step.name !== 'string') {
      continue;
    }
    const meta = asRecord(step.meta);
    const output =
      meta?.observationOutput ??
      (step.output != null && typeof step.output === 'object' && !Array.isArray(step.output)
        ? (step.output as Record<string, unknown>).observation
        : step.output);
    entries.push({
      runId: input.runId,
      turnId: input.turnId,
      name: step.name,
      output,
      createdAt: now,
    });
  }
  return entries;
}

function resolveReplayStepStatus(
  stepId: string,
  trace: ReplayTaskPlanTrace,
): TaskStepProgress['status'] {
  if (trace.completedStepIds.includes(stepId)) {
    return 'done';
  }
  if (trace.pendingStepIds.includes(stepId)) {
    return trace.currentStepId === stepId ? 'running' : 'pending';
  }
  if (trace.currentStepId === stepId) {
    return 'running';
  }
  return 'pending';
}

function buildStoredPlanFromTrace(trace: ReplayTaskPlanTrace): StoredTaskPlan {
  return {
    source: trace.source,
    originalUserRequest: trace.originalUserRequest,
    goal: trace.goal,
    deliverable: trace.deliverable,
    constraints: [],
    steps: trace.steps,
    pendingStepIds: [...trace.pendingStepIds],
    completedStepIds: [...trace.completedStepIds],
    taskPhase: trace.taskPhase,
    currentObjective: trace.currentObjective,
    currentStepId: trace.currentStepId,
  };
}

export function buildReplayActiveTask(input: {
  turnId: number;
  runId: number;
  userInput: string;
  runStatus: string;
  trace: ReplayTaskPlanTrace;
  observationLog: ObservationEntry[];
}): ActiveTask | null {
  if (input.trace.pendingStepIds.length === 0) {
    return null;
  }
  const plan = buildStoredPlanFromTrace(input.trace);
  const stepProgress: TaskStepProgress[] = plan.steps.map((planStep) => ({
    stepId: planStep.id,
    phase: planStep.phase,
    kind: planStep.kind,
    status: resolveReplayStepStatus(planStep.id, input.trace),
  }));
  const status: ActiveTaskStatus =
    input.runStatus === 'failed' ? 'failed' : 'in_progress';

  return {
    taskId: `task-${input.turnId}-${input.runId}`,
    status,
    plan,
    stepProgress,
    observationLog: input.observationLog,
    startedTurnId: input.turnId,
    lastTurnId: input.turnId,
    lastRunId: input.runId,
    updatedAt: new Date().toISOString(),
  };
}

export type ReplayRunRow = {
  id: number;
  turnId: number;
  steps: unknown;
  status: string;
  goaSnapshot?: unknown;
};

function resolveStepStatusFromPlan(
  stepId: string,
  plan: StoredTaskPlan,
): TaskStepProgress['status'] {
  if (plan.completedStepIds.includes(stepId)) {
    return 'done';
  }
  if (plan.pendingStepIds.includes(stepId)) {
    return plan.currentStepId === stepId ? 'running' : 'pending';
  }
  if (plan.currentStepId === stepId) {
    return 'running';
  }
  return 'pending';
}

export function buildActiveTaskFromGoaSnapshot(input: {
  turnId: number;
  runId: number;
  runStatus: string;
  snapshot: AgentRunGoaSnapshot;
  observationLog: ObservationEntry[];
}): ActiveTask | null {
  const plan = input.snapshot.storedTaskPlan;
  if (!plan || plan.steps.length === 0) {
    return null;
  }
  if (!isResumableGoaSnapshot(input.snapshot)) {
    return null;
  }
  let status = input.snapshot.activeTaskStatus;
  if (input.runStatus === 'failed' && status === 'in_progress') {
    status = 'failed';
  }
  const stepProgress: TaskStepProgress[] = plan.steps.map((planStep) => ({
    stepId: planStep.id,
    phase: planStep.phase,
    kind: planStep.kind,
    status: resolveStepStatusFromPlan(planStep.id, plan),
  }));

  return {
    taskId: `task-${input.turnId}-${input.runId}`,
    status,
    plan,
    stepProgress,
    observationLog: input.observationLog,
    startedTurnId: input.turnId,
    lastTurnId: input.turnId,
    lastRunId: input.runId,
    updatedAt: input.snapshot.capturedAt ?? new Date().toISOString(),
  };
}

export function replayActiveTaskFromRuns(input: {
  runs: ReplayRunRow[];
  turnUserInputById: Map<number, string>;
}): ActiveTask | null {
  const runsByTurn = new Map<number, ReplayRunRow[]>();
  for (const run of input.runs) {
    const bucket = runsByTurn.get(run.turnId) ?? [];
    bucket.push(run);
    runsByTurn.set(run.turnId, bucket);
  }

  const turnIds = [...runsByTurn.keys()].sort((a, b) => b - a);
  for (const turnId of turnIds) {
    const turnRuns = (runsByTurn.get(turnId) ?? []).sort((a, b) => b.id - a.id);
    const userInput = input.turnUserInputById.get(turnId) ?? '';

    const observationLog: ObservationEntry[] = [];
    for (const run of turnRuns) {
      observationLog.push(
        ...extractObservationLogFromRunSteps({
          turnId,
          runId: run.id,
          steps: run.steps,
        }),
      );
    }

    for (const run of turnRuns) {
      const snapshot = parseAgentRunGoaSnapshot(run.goaSnapshot);
      if (!snapshot) {
        continue;
      }
      const activeTask = buildActiveTaskFromGoaSnapshot({
        turnId,
        runId: run.id,
        runStatus: run.status,
        snapshot,
        observationLog,
      });
      if (activeTask) {
        return activeTask;
      }
    }

    let latestTrace: ReplayTaskPlanTrace | null = null;
    let traceRunId = 0;
    let traceRunStatus = 'success';

    for (const run of turnRuns) {
      const trace = extractLatestTaskPlanTraceFromSteps(run.steps, userInput);
      if (trace) {
        latestTrace = trace;
        traceRunId = run.id;
        traceRunStatus = run.status;
        break;
      }
    }
    if (!latestTrace || latestTrace.pendingStepIds.length === 0) {
      continue;
    }

    return buildReplayActiveTask({
      turnId,
      runId: traceRunId,
      userInput,
      runStatus: traceRunStatus,
      trace: latestTrace,
      observationLog,
    });
  }
  return null;
}
