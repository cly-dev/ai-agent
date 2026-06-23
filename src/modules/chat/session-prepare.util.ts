import type { SessionAllowedToolsRow } from './session-prepare.types';
import {
  buildSkillsRuntimeRevision,
  buildToolsRuntimeRevision,
  isRuntimeRevisionEqual,
} from '../../core/runtime-cache/runtime-revision.util';
import type { RuntimeRevision } from '../../core/runtime-cache/runtime-cache.types';

export function buildSessionRuntimeRevision(input: {
  tools: SessionAllowedToolsRow[];
  skills: Array<{ id: number; updatedAt?: Date | string }>;
  hostToolsRevision?: string;
}): RuntimeRevision {
  const toolParts = buildToolsRuntimeRevision(input.tools);
  return {
    tools: toolParts.tools,
    integrations: toolParts.integrations,
    skills: buildSkillsRuntimeRevision(input.skills),
    hostTools: input.hostToolsRevision ?? '',
  };
}

export function areSessionRuntimeRevisionsEqual(
  cached: RuntimeRevision | null | undefined,
  fresh: RuntimeRevision,
): boolean {
  return isRuntimeRevisionEqual(cached, fresh);
}

export function snapshotContainsAnyToolId(
  tools: Array<{ id: number }>,
  toolIds: Iterable<number>,
): boolean {
  const idSet = new Set(toolIds);
  return tools.some((tool) => idSet.has(tool.id));
}

export function isSessionRuntimeSnapshotValid(
  snapshot: {
    sessionId: string;
    userId: number;
    appClientId: number;
    agentId: number;
    tools: unknown[];
  },
  expected: {
    sessionId: string;
    userId: number;
    appClientId: number;
    agentId: number;
  },
): boolean {
  return (
    snapshot.sessionId === expected.sessionId &&
    snapshot.userId === expected.userId &&
    snapshot.appClientId === expected.appClientId &&
    snapshot.agentId === expected.agentId &&
    Array.isArray(snapshot.tools)
  );
}
