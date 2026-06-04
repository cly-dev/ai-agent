import type { SessionAllowedToolsRow } from './session-prepare.types';

export function buildToolIdsFingerprint(
  tools: Array<{ id: number }>,
): string {
  return tools
    .map((tool) => tool.id)
    .sort((a, b) => a - b)
    .join(',');
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
