import { resolveXShopIdFromUserMessage } from '../../../common/integration-site.util';
import {
  ARTIFACT_SUMMARY_MAX_CHARS,
  EPISODE_GOAL_MAX_CHARS,
  EPISODE_OUTCOME_MAX_CHARS,
  getSessionMemoryMaxArtifacts,
  getSessionMemoryMaxEpisodes,
  getSessionMemoryMaxObservationSnapshots,
} from '../shared/session-memory.constants';
import type {
  ActiveTask,
  ActiveTaskStatus,
  ObservationEntry,
  SessionArtifact,
  SessionArtifactKind,
  SessionGoaPayload,
  SessionMemoryRunStep,
  SessionMemoryUpdateContext,
  StoredTaskPlan,
  TaskStepProgress,
  TurnEpisode,
  TurnEpisodeStatus,
} from './session-goa.types';

function truncateText(value: string, maxChars: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxChars) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxChars)}…`;
}

function summarizeUnknownOutput(output: unknown): string {
  if (output === null || output === undefined) {
    return '';
  }
  if (typeof output === 'string') {
    return truncateText(output, ARTIFACT_SUMMARY_MAX_CHARS);
  }
  try {
    return truncateText(JSON.stringify(output), ARTIFACT_SUMMARY_MAX_CHARS);
  } catch {
    return truncateText(String(output), ARTIFACT_SUMMARY_MAX_CHARS);
  }
}

export function artifactIdFor(
  turnId: number,
  runId: number,
  stepId: string,
  kind: SessionArtifactKind,
): string {
  const safe = stepId.replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 48);
  return `art-${turnId}-${runId}-${safe || 'step'}-${kind}`;
}

function resolveGatherStepId(
  plan: StoredTaskPlan | null | undefined,
  gatherStep: SessionMemoryRunStep,
  usedStepIds: Set<string>,
): string {
  if (!plan) {
    return gatherStep.name ?? 'gather';
  }
  const match = plan.steps.find(
    (step) =>
      step.phase === 'gather' &&
      !usedStepIds.has(step.id) &&
      (gatherStep.name
        ? step.toolRole === gatherStep.name || step.objective.includes(gatherStep.name)
        : true),
  );
  if (match) {
    usedStepIds.add(match.id);
    return match.id;
  }
  const fallback = plan.steps.find(
    (step) => step.phase === 'gather' && !usedStepIds.has(step.id),
  );
  if (fallback) {
    usedStepIds.add(fallback.id);
    return fallback.id;
  }
  return gatherStep.name ?? 'gather';
}

function resolveToolObservationStepId(
  plan: StoredTaskPlan | null | undefined,
  toolName: string,
  usedStepIds: Set<string>,
): string {
  if (!plan) {
    return toolName;
  }
  const match = plan.steps.find(
    (step) =>
      step.kind === 'tool' &&
      !usedStepIds.has(step.id) &&
      (step.toolRole === toolName || step.objective.includes(toolName)),
  );
  if (match) {
    usedStepIds.add(match.id);
    return match.id;
  }
  const fallback = plan.steps.find(
    (step) => step.kind === 'tool' && !usedStepIds.has(step.id),
  );
  if (fallback) {
    usedStepIds.add(fallback.id);
    return fallback.id;
  }
  return toolName;
}

function resolveEpisodeStatus(ctx: SessionMemoryUpdateContext): TurnEpisodeStatus {
  if (ctx.runStatus === 'failed') {
    return 'failed';
  }
  if (ctx.intentKind === 'smalltalk') {
    return 'smalltalk';
  }
  if (ctx.storedTaskPlan || ctx.newToolObservations.length > 0) {
    return 'task';
  }
  return 'smalltalk';
}

function resolveEpisodeGoal(ctx: SessionMemoryUpdateContext): string {
  const fromPlan =
    ctx.storedTaskPlan?.goal?.trim() ||
    ctx.storedTaskPlan?.originalUserRequest?.trim();
  if (fromPlan) {
    return truncateText(fromPlan, EPISODE_GOAL_MAX_CHARS);
  }
  return truncateText(ctx.userInput, EPISODE_GOAL_MAX_CHARS);
}

function extractGatherMetrics(
  step: SessionMemoryRunStep,
): Record<string, string | number> | undefined {
  if (step.type !== 'gather' || step.output == null || typeof step.output !== 'object') {
    return undefined;
  }
  const row = step.output as Record<string, unknown>;
  const metrics: Record<string, string | number> = {};
  if (typeof row.total === 'number') {
    metrics.total = row.total;
  }
  if (typeof row.fetchedCount === 'number') {
    metrics.fetchedCount = row.fetchedCount;
  }
  if (typeof row.pageCount === 'number') {
    metrics.pages = row.pageCount;
  }
  return Object.keys(metrics).length > 0 ? metrics : undefined;
}

function summarizeGatherStep(step: SessionMemoryRunStep): string {
  if (step.output == null || typeof step.output !== 'object') {
    return step.name ? `gather ${step.name}` : 'gather complete';
  }
  const row = step.output as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof row.fetchedCount === 'number') {
    parts.push(`fetched=${row.fetchedCount}`);
  }
  if (typeof row.total === 'number') {
    parts.push(`total=${row.total}`);
  }
  if (typeof row.pageCount === 'number') {
    parts.push(`pages=${row.pageCount}`);
  }
  const tool = step.name ?? 'list';
  return truncateText(
    parts.length > 0 ? `[${tool}] ${parts.join('; ')}` : `[${tool}] gather complete`,
    ARTIFACT_SUMMARY_MAX_CHARS,
  );
}

export function buildArtifactsFromAgentRun(
  ctx: SessionMemoryUpdateContext,
): SessionArtifact[] {
  const now = new Date().toISOString();
  const artifacts: SessionArtifact[] = [];
  const gatherSteps = (ctx.runSteps ?? []).filter((step) => step.type === 'gather');
  const usedStepIds = new Set<string>();

  for (const step of gatherSteps) {
    const toolName = step.name ?? 'gather';
    const stepId = resolveGatherStepId(ctx.storedTaskPlan, step, usedStepIds);
    artifacts.push({
      id: artifactIdFor(ctx.turnId, ctx.runId, stepId, 'gather'),
      turnId: ctx.turnId,
      runId: ctx.runId,
      stepId,
      kind: 'gather',
      toolName,
      summary: summarizeGatherStep(step),
      meta: extractGatherMetrics(step),
      createdAt: now,
    });
  }

  const gatherToolNames = new Set(gatherSteps.map((step) => step.name).filter(Boolean));
  for (const observation of ctx.newToolObservations) {
    if (gatherToolNames.has(observation.name)) {
      continue;
    }
    const summary = summarizeUnknownOutput(observation.output);
    if (!summary) {
      continue;
    }
    const stepId = resolveToolObservationStepId(
      ctx.storedTaskPlan,
      observation.name,
      usedStepIds,
    );
    artifacts.push({
      id: artifactIdFor(ctx.turnId, ctx.runId, stepId, 'tool_result'),
      turnId: ctx.turnId,
      runId: ctx.runId,
      stepId,
      kind: 'tool_result',
      toolName: observation.name,
      summary: truncateText(`[${observation.name}] ${summary}`, ARTIFACT_SUMMARY_MAX_CHARS),
      createdAt: now,
    });
  }

  return artifacts;
}

export function buildTurnEpisodeFromAgentRun(
  ctx: SessionMemoryUpdateContext,
  artifacts: SessionArtifact[],
): TurnEpisode {
  const gatherMetrics = (ctx.runSteps ?? [])
    .filter((step) => step.type === 'gather')
    .map((step) => extractGatherMetrics(step))
    .find((metrics) => metrics != null);

  return {
    turnId: ctx.turnId,
    runId: ctx.runId,
    goal: resolveEpisodeGoal(ctx),
    outcome: truncateText(ctx.finalOutput, EPISODE_OUTCOME_MAX_CHARS),
    status: resolveEpisodeStatus(ctx),
    toolsUsed: [
      ...new Set(ctx.newToolObservations.map((row) => row.name).filter(Boolean)),
    ],
    metrics: gatherMetrics,
    artifactRefs: artifacts.map((artifact) => artifact.id),
    createdAt: new Date().toISOString(),
  };
}

function resolveArtifactRefForPlanStep(
  planStep: { id: string; phase: string; kind: string },
  artifacts: SessionArtifact[],
  usedArtifactIds: Set<string>,
  turnId: number,
  runId: number,
): string | undefined {
  const byStepId = artifacts.find(
    (artifact) =>
      artifact.stepId === planStep.id && !usedArtifactIds.has(artifact.id),
  );
  if (byStepId) {
    usedArtifactIds.add(byStepId.id);
    return byStepId.id;
  }
  const expectedKind: SessionArtifactKind | undefined =
    planStep.phase === 'gather'
      ? 'gather'
      : planStep.kind === 'tool'
        ? 'tool_result'
        : undefined;
  if (!expectedKind) {
    return undefined;
  }
  const expectedId = artifactIdFor(turnId, runId, planStep.id, expectedKind);
  const byId = artifacts.find(
    (artifact) => artifact.id === expectedId && !usedArtifactIds.has(artifact.id),
  );
  if (byId) {
    usedArtifactIds.add(byId.id);
    return byId.id;
  }
  return undefined;
}

function summarizeStepFromRun(
  planStep: StoredTaskPlan['steps'][number],
  ctx: SessionMemoryUpdateContext,
  artifacts: SessionArtifact[],
): string | undefined {
  if (planStep.kind === 'summarize' || planStep.phase === 'answer') {
    return truncateText(ctx.finalOutput, 200);
  }
  const gather = (ctx.runSteps ?? []).find(
    (step) => step.type === 'gather' && step.name,
  );
  if (gather) {
    return summarizeGatherStep(gather);
  }
  const artifact = artifacts.find((row) => row.stepId === planStep.id);
  return artifact?.summary ?? artifacts.find((row) => row.toolName)?.summary;
}

function resolveActiveTaskStatus(input: {
  plan: StoredTaskPlan;
  runStatus?: 'success' | 'failed';
  awaitingWriteConfirmation?: boolean;
}): ActiveTaskStatus {
  if (input.awaitingWriteConfirmation) {
    return 'awaiting_confirmation';
  }
  if (input.runStatus === 'failed') {
    return 'failed';
  }
  const allDone = input.plan.steps.every((step) =>
    input.plan.completedStepIds.includes(step.id),
  );
  return allDone ? 'completed' : 'in_progress';
}

export function buildActiveTaskFromAgentRun(input: {
  ctx: SessionMemoryUpdateContext;
  artifacts: SessionArtifact[];
  prev: ActiveTask | null;
}): ActiveTask | null {
  const plan = input.ctx.storedTaskPlan;
  if (!plan || plan.steps.length === 0) {
    return null;
  }

  const completed = new Set(plan.completedStepIds);
  const pending = new Set(plan.pendingStepIds);
  const usedArtifactIds = new Set<string>();
  const stepProgress: TaskStepProgress[] = plan.steps.map((planStep) => {
    let status: TaskStepProgress['status'] = 'pending';
    if (completed.has(planStep.id)) {
      status = 'done';
    } else if (pending.has(planStep.id)) {
      status = plan.currentStepId === planStep.id ? 'running' : 'pending';
    } else if (plan.currentStepId === planStep.id) {
      status = 'running';
    }
    const artifactRef = resolveArtifactRefForPlanStep(
      planStep,
      input.artifacts,
      usedArtifactIds,
      input.ctx.turnId,
      input.ctx.runId,
    );
    return {
      stepId: planStep.id,
      phase: planStep.phase,
      kind: planStep.kind,
      status,
      summary:
        status === 'done' || status === 'running'
          ? summarizeStepFromRun(planStep, input.ctx, input.artifacts)
          : undefined,
      artifactRef,
    };
  });

  const observationLog = appendObservationEntries(
    input.prev?.observationLog ?? [],
    buildObservationEntriesFromContext(input.ctx),
  );

  return {
    taskId: input.prev?.taskId ?? `task-${input.ctx.turnId}-${input.ctx.runId}`,
    status: resolveActiveTaskStatus({
      plan,
      runStatus: input.ctx.runStatus,
      awaitingWriteConfirmation: input.ctx.awaitingWriteConfirmation,
    }),
    plan,
    stepProgress,
    observationLog,
    startedTurnId: input.prev?.startedTurnId ?? input.ctx.turnId,
    lastTurnId: input.ctx.turnId,
    lastRunId: input.ctx.runId,
    updatedAt: new Date().toISOString(),
  };
}

export function buildObservationEntriesFromContext(
  ctx: SessionMemoryUpdateContext,
): ObservationEntry[] {
  const now = new Date().toISOString();
  return ctx.newToolObservations.map((row) => ({
    runId: ctx.runId,
    turnId: ctx.turnId,
    name: row.name,
    output: row.output,
    createdAt: now,
  }));
}

function observationEntryKey(row: ObservationEntry): string {
  try {
    return `${row.runId}:${row.turnId}:${row.name}:${JSON.stringify(row.output)}`;
  } catch {
    return `${row.runId}:${row.turnId}:${row.name}:${String(row.output)}`;
  }
}

export function appendObservationEntries(
  existing: ObservationEntry[],
  incoming: ObservationEntry[],
): ObservationEntry[] {
  if (incoming.length === 0) {
    return existing;
  }
  const keys = new Set(existing.map((row) => observationEntryKey(row)));
  const merged = [...existing];
  for (const row of incoming) {
    const key = observationEntryKey(row);
    if (keys.has(key)) {
      continue;
    }
    keys.add(key);
    merged.push(row);
  }
  const max = getSessionMemoryMaxObservationSnapshots() * 50;
  return merged.slice(-max);
}

export function resolvePersistedActiveTask(input: {
  base: SessionGoaPayload;
  built: ActiveTask | null;
  ctx: SessionMemoryUpdateContext;
}): ActiveTask | null {
  if (input.built) {
    return input.built;
  }
  const prev = input.base.activeTask;
  if (!prev) {
    return null;
  }
  if (input.ctx.intentKind === 'smalltalk') {
    return null;
  }
  if (input.ctx.runStatus === 'failed') {
    if (
      prev.status === 'in_progress' ||
      prev.status === 'awaiting_confirmation'
    ) {
      return {
        ...prev,
        status: 'failed',
        updatedAt: new Date().toISOString(),
      };
    }
    return prev;
  }
  if (
    prev.status === 'in_progress' ||
    prev.status === 'awaiting_confirmation'
  ) {
    return prev;
  }
  return null;
}

export function mergeSessionEntities(
  prev: Record<string, unknown>,
  userInput: string,
): Record<string, unknown> {
  const entities = { ...prev };
  const shopId = resolveXShopIdFromUserMessage(userInput);
  if (shopId && String(entities.xShopId ?? '').trim() === '') {
    entities.xShopId = shopId;
  }
  return entities;
}

export function mergeTurnEpisodes(
  existing: TurnEpisode,
  incoming: TurnEpisode,
): TurnEpisode {
  return {
    ...incoming,
    goal: existing.goal || incoming.goal,
    outcome: incoming.outcome || existing.outcome,
    status:
      incoming.status === 'failed'
        ? 'failed'
        : existing.status === 'task' || incoming.status === 'task'
          ? 'task'
          : incoming.status,
    toolsUsed: [
      ...new Set([...existing.toolsUsed, ...incoming.toolsUsed]),
    ],
    artifactRefs: [
      ...new Set([...existing.artifactRefs, ...incoming.artifactRefs]),
    ],
    metrics: incoming.metrics ?? existing.metrics,
    runId: incoming.runId,
  };
}

export function appendEpisodeFifo(
  existing: TurnEpisode[],
  episode: TurnEpisode,
): TurnEpisode[] {
  const max = getSessionMemoryMaxEpisodes();
  const prior = existing.find((row) => row.turnId === episode.turnId);
  const withoutDup = existing.filter((row) => row.turnId !== episode.turnId);
  const merged = prior ? mergeTurnEpisodes(prior, episode) : episode;
  return [...withoutDup, merged].slice(-max);
}

export function appendArtifactsFifo(
  existing: SessionArtifact[],
  incoming: SessionArtifact[],
): SessionArtifact[] {
  const max = getSessionMemoryMaxArtifacts();
  const incomingIds = new Set(incoming.map((row) => row.id));
  const kept = existing.filter((row) => !incomingIds.has(row.id));
  return [...kept, ...incoming].slice(-max);
}

export function collectArtifactRefsForPrompt(input: {
  episodes: TurnEpisode[];
  activeTask: ActiveTask | null | undefined;
  maxEpisodes?: number;
}): string[] {
  const refs = new Set<string>();
  const episodeSlice = input.episodes.slice(-(input.maxEpisodes ?? 2));
  for (const episode of episodeSlice) {
    for (const ref of episode.artifactRefs) {
      refs.add(ref);
    }
  }
  for (const step of input.activeTask?.stepProgress ?? []) {
    if (step.artifactRef) {
      refs.add(step.artifactRef);
    }
  }
  return [...refs];
}

export function flattenObservationLog(
  log: ObservationEntry[],
): Array<{ name: string; output: unknown }> {
  return log.map((row) => ({ name: row.name, output: row.output }));
}

export function formatRecentEpisodesForPrompt(episodes: TurnEpisode[]): string | null {
  if (episodes.length === 0) {
    return null;
  }
  const lines = episodes.slice(-5).map((episode) => {
    const tools =
      episode.toolsUsed.length > 0 ? `tools=${episode.toolsUsed.join(',')}` : 'tools=none';
    const metrics =
      episode.metrics && Object.keys(episode.metrics).length > 0
        ? ` metrics=${Object.entries(episode.metrics)
            .map(([k, v]) => `${k}=${v}`)
            .join(',')}`
        : '';
    const refs =
      episode.artifactRefs.length > 0
        ? ` refs=${episode.artifactRefs.join(',')}`
        : '';
    return `- [t${episode.turnId}] status=${episode.status} goal: ${episode.goal} | outcome: ${episode.outcome} | ${tools}${metrics}${refs}`;
  });
  return `<recent_episodes>\n${lines.join('\n')}\n</recent_episodes>`;
}

export function formatArtifactsForPrompt(
  artifacts: SessionArtifact[],
  episodeRefs: string[],
): string | null {
  if (episodeRefs.length === 0) {
    return null;
  }
  const refSet = new Set(episodeRefs);
  const rows = artifacts.filter((artifact) => refSet.has(artifact.id));
  if (rows.length === 0) {
    return null;
  }
  const lines = rows.map((artifact) => {
    const meta =
      artifact.meta && Object.keys(artifact.meta).length > 0
        ? ` ${Object.entries(artifact.meta)
            .map(([k, v]) => `${k}=${v}`)
            .join(',')}`
        : '';
    return `- ${artifact.id} (${artifact.kind}${artifact.toolName ? `:${artifact.toolName}` : ''}): ${artifact.summary}${meta}`;
  });
  return `<artifact_summaries>\n${lines.join('\n')}\n</artifact_summaries>`;
}

export function formatActiveTaskForPrompt(
  activeTask: ActiveTask | null | undefined,
): string | null {
  if (!activeTask) {
    return null;
  }
  if (
    activeTask.status === 'completed' ||
    activeTask.status === 'failed' ||
    activeTask.status === 'abandoned'
  ) {
    return null;
  }
  const stepLines = activeTask.stepProgress.map((step) => {
    const summary = step.summary ? ` — ${step.summary}` : '';
    return `  - [${step.status}] ${step.stepId} (${step.phase}/${step.kind})${summary}`;
  });
  return [
    '<active_task>',
    `goal: ${activeTask.plan.goal}`,
    `deliverable: ${activeTask.plan.deliverable}`,
    `status: ${activeTask.status}`,
    'steps:',
    ...stepLines,
    '</active_task>',
  ].join('\n');
}

export function formatEntitiesForPrompt(
  entities: Record<string, unknown> | undefined,
): string | null {
  if (!entities) {
    return null;
  }
  const entries = Object.entries(entities)
    .filter(([, value]) => value != null && String(value).trim().length > 0)
    .slice(0, 12)
    .map(([key, value]) => `${key}=${String(value)}`);
  if (entries.length === 0) {
    return null;
  }
  return `<session_entities>\n${entries.join('\n')}\n</session_entities>`;
}

export function formatGoaContextHint(
  episodes: TurnEpisode[],
  activeTask: ActiveTask | null | undefined,
): string {
  const parts: string[] = [];
  const last = episodes[episodes.length - 1];
  if (last) {
    parts.push(
      `lastEpisode=[t${last.turnId}] goal=${last.goal}; outcome=${last.outcome}`,
    );
  }
  if (activeTask) {
    parts.push(
      `activeTask=${activeTask.status}; goal=${activeTask.plan.goal}; pending=${activeTask.stepProgress
        .filter((step) => step.status === 'pending' || step.status === 'running')
        .map((step) => step.stepId)
        .join(',')}`,
    );
  }
  return parts.join('; ');
}

export function formatGoaForHistoryCompression(payload: SessionGoaPayload): string {
  const parts: string[] = [];
  const episodeLines = (payload.recentEpisodes ?? [])
    .slice(-3)
    .map(
      (ep) =>
        `[t${ep.turnId}] ${ep.status} goal=${ep.goal} outcome=${ep.outcome}`,
    );
  if (episodeLines.length > 0) {
    parts.push(`Recent episodes:\n${episodeLines.join('\n')}`);
  }
  if (payload.activeTask) {
    parts.push(
      `Active task: ${payload.activeTask.status} goal=${payload.activeTask.plan.goal}`,
    );
  }
  const shopId = payload.entities?.xShopId;
  if (shopId != null && String(shopId).trim()) {
    parts.push(`Session entity xShopId=${String(shopId)}`);
  }
  return parts.join('\n\n');
}
