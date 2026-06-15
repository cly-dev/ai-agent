import type {
  ActiveTask,
  SessionArtifact,
  SessionGoaPayload,
  TurnEpisode,
} from '../../../memory/goa/session-goa.types';
import {
  buildSessionGoaStorageLimits,
  countRowsInObservationOutput,
  mergeSessionObservationEntries,
  summarizeObservationArgs,
} from '../../../memory/goa/session-goa-full-projection.util';
import type { ToolObservation } from './agent-engine.types';
import type { PlanSessionWorkingMemory } from './task-plan.types';
import {
  isPlanToolStepSatisfiedByObservations,
  type PlanScopedTool,
  resolveScopedToolRoleForPlan,
} from './task-plan.util';
import type { TaskPlanStep, TaskStepPhase } from './task-plan.types';
import type { ToolDecisionRole } from '../../../tool-engine/tool-decision-role.enum';

function buildToolRoleByName(
  scopedTools: PlanScopedTool[],
): Map<string, ToolDecisionRole> {
  const map = new Map<string, ToolDecisionRole>();
  for (const tool of scopedTools) {
    map.set(tool.name, resolveScopedToolRoleForPlan(tool));
  }
  return map;
}

function buildEpisodesForPlan(
  episodes: TurnEpisode[],
): PlanSessionWorkingMemory['episodes'] {
  return episodes.map((episode) => ({
    turnId: episode.turnId,
    runId: episode.runId,
    goal: episode.goal,
    outcome: episode.outcome,
    status: episode.status,
    toolsUsed: episode.toolsUsed,
    artifactRefs: episode.artifactRefs,
    ...(episode.metrics && Object.keys(episode.metrics).length > 0
      ? { metrics: episode.metrics }
      : {}),
    createdAt: episode.createdAt,
  }));
}

function buildArtifactsForPlan(
  artifacts: SessionArtifact[],
): PlanSessionWorkingMemory['artifacts'] {
  return artifacts.map((artifact) => ({
    id: artifact.id,
    turnId: artifact.turnId,
    kind: artifact.kind,
    summary: artifact.summary,
    ...(artifact.toolName ? { toolName: artifact.toolName } : {}),
    ...(artifact.stepId ? { stepId: artifact.stepId } : {}),
    ...(artifact.meta && Object.keys(artifact.meta).length > 0
      ? { meta: artifact.meta }
      : {}),
    createdAt: artifact.createdAt,
  }));
}

function buildActiveTaskForPlan(
  activeTask: ActiveTask | null | undefined,
): PlanSessionWorkingMemory['activeTask'] {
  if (!activeTask) {
    return undefined;
  }
  return {
    status: activeTask.status,
    goal: activeTask.plan.goal,
    deliverable: activeTask.plan.deliverable,
    originalUserRequest: activeTask.plan.originalUserRequest,
    pendingStepIds: activeTask.plan.pendingStepIds,
    completedStepIds: activeTask.plan.completedStepIds,
    currentStepId: activeTask.plan.currentStepId,
    stepProgress: activeTask.stepProgress.map((step) => ({
      stepId: step.stepId,
      phase: step.phase,
      kind: step.kind,
      status: step.status,
      ...(step.summary ? { summary: step.summary } : {}),
      ...(step.artifactRef ? { artifactRef: step.artifactRef } : {}),
    })),
  };
}

function buildSatisfiedToolRolesForPlan(input: {
  scopedTools: PlanScopedTool[];
  /** 仅本 run 观测可标记 satisfied（与 pre_tools 跳步语义一致）。 */
  runOwnedObservations: ToolObservation[];
}): string[] {
  const roles = new Set<ToolDecisionRole>();
  for (const tool of input.scopedTools) {
    const role = resolveScopedToolRoleForPlan(tool);
    if (role !== 'unknown') {
      roles.add(role);
    }
  }
  const satisfied: string[] = [];
  for (const role of roles) {
    const step: TaskPlanStep = {
      id: `memory-check-${role}`,
      phase: defaultPhaseForToolRole(role),
      kind: 'tool',
      toolRole: role,
      objective: `Reuse session data for ${role} when sufficient.`,
    };
    if (
      isPlanToolStepSatisfiedByObservations({
        step,
        observations: input.runOwnedObservations,
        scopedTools: input.scopedTools,
        purpose: 'pre_tools_advance',
      })
    ) {
      satisfied.push(role);
    }
  }
  return satisfied;
}

function defaultPhaseForToolRole(role: ToolDecisionRole): TaskStepPhase {
  if (
    role === 'write-batch' ||
    role === 'write-single' ||
    role === 'write-meta' ||
    role === 'admin'
  ) {
    return 'mutate';
  }
  if (role === 'read-stats') {
    return 'analyze';
  }
  return 'gather';
}

function buildEntitiesForPlan(
  entities: Record<string, unknown> | undefined,
): Record<string, string> | undefined {
  if (!entities) {
    return undefined;
  }
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(entities)) {
    if (value == null) {
      continue;
    }
    const text = String(value).trim();
    if (text.length > 0) {
      out[key] = text;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function isPlanWorkingMemoryEmpty(
  memory: PlanSessionWorkingMemory,
): boolean {
  return (
    memory.episodes.length === 0 &&
    memory.artifacts.length === 0 &&
    memory.observationInventory.length === 0 &&
    memory.satisfiedToolRoles.length === 0 &&
    (!memory.entities || Object.keys(memory.entities).length === 0) &&
    memory.activeTask == null
  );
}

/**
 * Plan LLM 用的会话工作记忆：与 Decision PromptComposer 共用同一 GOA 快照边界
 *（条数上限与 SESSION_MEMORY_MAX_* 一致，不做 prompt 层二次截断）。
 */
export function buildPlanSessionWorkingMemory(input: {
  goa: SessionGoaPayload | null;
  scopedTools: PlanScopedTool[];
  runOwnedObservations: ToolObservation[];
}): PlanSessionWorkingMemory | null {
  if (!input.goa) {
    return null;
  }
  const episodes = input.goa.recentEpisodes ?? [];
  const artifacts = input.goa.sessionArtifacts ?? [];
  const ledgerEntries = mergeSessionObservationEntries(input.goa);
  const toolRoleByName = buildToolRoleByName(input.scopedTools);

  const memory: PlanSessionWorkingMemory = {
    coverage: 'full_session_goa',
    storageLimits: buildSessionGoaStorageLimits(),
    episodes: buildEpisodesForPlan(episodes),
    artifacts: buildArtifactsForPlan(artifacts),
    observationInventory: ledgerEntries.map((entry) => {
      const toolRole = toolRoleByName.get(entry.name);
      const rowCount = countRowsInObservationOutput(entry.output);
      return {
        tool: entry.name,
        runId: entry.runId,
        ...(toolRole && toolRole !== 'unknown' ? { toolRole } : {}),
        argsSummary: summarizeObservationArgs(entry.args),
        turnId: entry.turnId,
        createdAt: entry.createdAt,
        ...(rowCount != null ? { rowCount } : {}),
      };
    }),
    satisfiedToolRoles: buildSatisfiedToolRolesForPlan({
      scopedTools: input.scopedTools,
      runOwnedObservations: input.runOwnedObservations,
    }),
    entities: buildEntitiesForPlan(input.goa.entities),
    activeTask: buildActiveTaskForPlan(input.goa.activeTask),
  };
  return isPlanWorkingMemoryEmpty(memory) ? null : memory;
}
