import type { SessionAllowedToolsRow } from './session-prepare.types';

export function buildToolIdsFingerprint(
  tools: Array<{ id: number }>,
): string {
  return buildIdsFingerprint(tools);
}

export function buildSkillIdsFingerprint(
  skills: Array<{ id: number }>,
): string {
  return buildIdsFingerprint(skills);
}

function buildIdsFingerprint(rows: Array<{ id: number }>): string {
  return rows
    .map((row) => row.id)
    .sort((a, b) => a - b)
    .join(',');
}

export function areToolIdSetsEqual(
  left: Array<{ id: number }>,
  right: Array<{ id: number }>,
): boolean {
  return buildToolIdsFingerprint(left) === buildToolIdsFingerprint(right);
}

export function areSkillIdSetsEqual(
  left: Array<{ id: number }>,
  right: Array<{ id: number }>,
): boolean {
  return buildSkillIdsFingerprint(left) === buildSkillIdsFingerprint(right);
}

export function snapshotContainsAnyToolId(
  tools: Array<{ id: number }>,
  toolIds: Iterable<number>,
): boolean {
  const idSet = new Set(toolIds);
  return tools.some((tool) => idSet.has(tool.id));
}

export function isSessionPrepareSnapshotValid(
  snapshot: {
    sessionId: string;
    userId: number;
    appClientId: number;
    agentId: number;
    tools: SessionAllowedToolsRow[];
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
