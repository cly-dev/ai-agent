import { sessionLedgerEntryKey } from './session-goa-ledger.util';
import { formatWorkflowRunPendingSummary } from '../../workflow/workflow-goa-projection.util';
import type {
  ActiveTask,
  ObservationEntry,
  SessionArtifact,
  SessionGoaPayload,
  TurnEpisode,
} from './session-goa.types';
import {
  getSessionMemoryMaxArtifacts,
  getSessionMemoryMaxEpisodes,
  getSessionMemoryMaxObservationLedgerEntries,
} from '../shared/session-memory.constants';
import { compactArgsForObservation } from '../../agent-engine/engine/observation-format.util';

export type SessionGoaStorageLimits = {
  maxEpisodes: number;
  maxArtifacts: number;
  maxObservationLedgerEntries: number;
};

export function buildSessionGoaStorageLimits(): SessionGoaStorageLimits {
  return {
    maxEpisodes: getSessionMemoryMaxEpisodes(),
    maxArtifacts: getSessionMemoryMaxArtifacts(),
    maxObservationLedgerEntries: getSessionMemoryMaxObservationLedgerEntries(),
  };
}

function isObservationRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function countRowsInObservationOutput(output: unknown): number | undefined {
  if (Array.isArray(output)) {
    return output.length;
  }
  if (!isObservationRecord(output)) {
    return undefined;
  }
  const data = output.data;
  if (Array.isArray(data)) {
    return data.length;
  }
  const total = output.total;
  if (typeof total === 'number' && Number.isFinite(total)) {
    return total;
  }
  return undefined;
}

export function summarizeObservationArgs(
  args: Record<string, unknown> | undefined,
): string {
  const compact = compactArgsForObservation(args);
  if (!compact || Object.keys(compact).length === 0) {
    return '(no args)';
  }
  return JSON.stringify(compact);
}

/** 与图预载一致：ledger 全量 + 可续跑 activeTask.observationLog（同键后者覆盖）。 */
export function mergeSessionObservationEntries(
  goa: SessionGoaPayload,
): ObservationEntry[] {
  const ledger = goa.sessionObservationLedger ?? [];
  const active = goa.activeTask;
  const fromActive =
    active &&
    (active.status === 'in_progress' ||
      active.status === 'awaiting_confirmation')
      ? active.observationLog
      : [];

  const byKey = new Map<string, ObservationEntry>();
  for (const row of ledger) {
    byKey.set(sessionLedgerEntryKey(row), row);
  }
  for (const row of fromActive) {
    byKey.set(sessionLedgerEntryKey(row), row);
  }
  return [...byKey.values()].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}

export function formatSessionGoaCoverageForPrompt(): string {
  const limits = buildSessionGoaStorageLimits();
  return [
    '<session_goa_coverage>',
    'coverage=full_session_goa',
    `maxEpisodes=${limits.maxEpisodes}`,
    `maxArtifacts=${limits.maxArtifacts}`,
    `maxObservationLedgerEntries=${limits.maxObservationLedgerEntries}`,
    'All blocks below list every entry currently stored for this session (no prompt-layer sampling).',
    '</session_goa_coverage>',
  ].join('\n');
}

export function formatRecentEpisodesForPrompt(episodes: TurnEpisode[]): string | null {
  if (episodes.length === 0) {
    return null;
  }
  const lines = episodes.map((episode) => {
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
    return `- [t${episode.turnId}/r${episode.runId}] status=${episode.status} goal: ${episode.goal} | outcome: ${episode.outcome} | ${tools}${metrics}${refs}`;
  });
  return `<recent_episodes>\n${lines.join('\n')}\n</recent_episodes>`;
}

export function formatArtifactsForPrompt(
  artifacts: SessionArtifact[],
): string | null {
  if (artifacts.length === 0) {
    return null;
  }
  const lines = artifacts.map((artifact) => {
    const meta =
      artifact.meta && Object.keys(artifact.meta).length > 0
        ? ` ${Object.entries(artifact.meta)
            .map(([k, v]) => `${k}=${v}`)
            .join(',')}`
        : '';
    const step = artifact.stepId ? ` step=${artifact.stepId}` : '';
    return `- ${artifact.id} (t${artifact.turnId}${step}; ${artifact.kind}${artifact.toolName ? `:${artifact.toolName}` : ''}): ${artifact.summary}${meta}`;
  });
  return `<artifact_summaries>\n${lines.join('\n')}\n</artifact_summaries>`;
}

export function formatObservationInventoryForPrompt(
  entries: ObservationEntry[],
  toolRoleByName?: ReadonlyMap<string, string>,
): string | null {
  if (entries.length === 0) {
    return null;
  }
  const lines = entries.map((entry) => {
    const toolRole = toolRoleByName?.get(entry.name);
    const rowCount = countRowsInObservationOutput(entry.output);
    const rolePart =
      toolRole && toolRole !== 'unknown' ? ` role=${toolRole}` : '';
    const rowsPart = rowCount != null ? ` rows=${rowCount}` : '';
    return `- [t${entry.turnId}/r${entry.runId}] tool=${entry.name}${rolePart} args=${summarizeObservationArgs(entry.args)}${rowsPart}`;
  });
  return `<observation_inventory>\n${lines.join('\n')}\n</observation_inventory>`;
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
    const artifactRef = step.artifactRef ? ` ref=${step.artifactRef}` : '';
    return `  - [${step.status}] ${step.stepId} (${step.phase}/${step.kind})${summary}${artifactRef}`;
  });
  const workflowLines =
    activeTask.workflowRun != null
      ? [
          `workflow: ${formatWorkflowRunPendingSummary(activeTask.workflowRun)}`,
          ...activeTask.workflowRun.nodes.map(
            (node) =>
              `  - [${node.status}] ${node.nodeId} (${node.action})${node.outputRef ? ` ref=${node.outputRef}` : ''}`,
          ),
        ]
      : [];
  return [
    '<active_task>',
    `goal: ${activeTask.plan.goal}`,
    `originalRequest: ${activeTask.plan.originalUserRequest}`,
    `deliverable: ${activeTask.plan.deliverable}`,
    `status: ${activeTask.status}`,
    `pendingSteps: ${activeTask.plan.pendingStepIds.join(', ') || 'none'}`,
    `completedSteps: ${activeTask.plan.completedStepIds.join(', ') || 'none'}`,
    'steps:',
    ...stepLines,
    ...(workflowLines.length > 0 ? ['workflowNodes:', ...workflowLines] : []),
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
    .map(([key, value]) => `${key}=${String(value)}`);
  if (entries.length === 0) {
    return null;
  }
  return `<session_entities>\n${entries.join('\n')}\n</session_entities>`;
}

/** PromptComposer / Plan 共用的完整 GOA system 块（顺序固定）。 */
export function buildFullSessionGoaPromptMessages(
  payload: SessionGoaPayload,
  options?: {
    toolRoleByName?: ReadonlyMap<string, string>;
  },
): Array<{ role: 'system'; content: string }> {
  const messages: Array<{ role: 'system'; content: string }> = [];
  const hasAnyContent =
    payload.recentEpisodes.length > 0 ||
    payload.sessionArtifacts.length > 0 ||
    mergeSessionObservationEntries(payload).length > 0 ||
    payload.activeTask != null ||
    Object.keys(payload.entities ?? {}).length > 0;

  if (!hasAnyContent) {
    return messages;
  }

  messages.push({
    role: 'system',
    content: formatSessionGoaCoverageForPrompt(),
  });

  const episodesText = formatRecentEpisodesForPrompt(payload.recentEpisodes);
  if (episodesText) {
    messages.push({ role: 'system', content: episodesText });
  }

  const artifactsText = formatArtifactsForPrompt(payload.sessionArtifacts);
  if (artifactsText) {
    messages.push({ role: 'system', content: artifactsText });
  }

  const inventoryText = formatObservationInventoryForPrompt(
    mergeSessionObservationEntries(payload),
    options?.toolRoleByName,
  );
  if (inventoryText) {
    messages.push({ role: 'system', content: inventoryText });
  }

  const taskText = formatActiveTaskForPrompt(payload.activeTask);
  if (taskText) {
    messages.push({ role: 'system', content: taskText });
  }

  const entitiesText = formatEntitiesForPrompt(payload.entities);
  if (entitiesText) {
    messages.push({ role: 'system', content: entitiesText });
  }

  return messages;
}
