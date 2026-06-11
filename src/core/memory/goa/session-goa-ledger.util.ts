import { isAgentToolErrorObservation } from '../../agent-engine/engine/agent-run-user-messages.util';
import { compactArgsForObservation } from '../../agent-engine/engine/observation-format.util';
import { getSessionMemoryMaxObservationLedgerEntries } from '../shared/session-memory.constants';
import type { ObservationEntry, SessionGoaPayload } from './session-goa.types';

function stableJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/** 会话 ledger 去重键：tool + 归一化 args；无 args 时退化为 tool + output 摘要。 */
export function sessionLedgerEntryKey(row: ObservationEntry): string {
  const args = compactArgsForObservation(row.args);
  if (args && Object.keys(args).length > 0) {
    return `${row.name}:${stableJson(args)}`;
  }
  const output = stableJson(row.output);
  const clipped =
    output.length > 256 ? `${output.slice(0, 256)}…len=${output.length}` : output;
  return `${row.name}:${clipped}`;
}

export function isLedgerEligibleObservation(row: {
  name: string;
  output: unknown;
}): boolean {
  if (!row.name.trim()) {
    return false;
  }
  if (isAgentToolErrorObservation(row.output)) {
    return false;
  }
  return row.output !== undefined;
}

export function appendSessionObservationLedger(
  existing: ObservationEntry[],
  incoming: ObservationEntry[],
): ObservationEntry[] {
  if (incoming.length === 0) {
    return existing;
  }
  const max = getSessionMemoryMaxObservationLedgerEntries();
  const byKey = new Map<string, ObservationEntry>();
  for (const row of existing) {
    byKey.set(sessionLedgerEntryKey(row), row);
  }
  for (const row of incoming) {
    if (!isLedgerEligibleObservation(row)) {
      continue;
    }
    byKey.set(sessionLedgerEntryKey(row), row);
  }
  const merged = [...byKey.values()].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  return merged.slice(-max);
}

export function buildObservationLedgerEntriesFromContext(input: {
  turnId: number;
  runId: number;
  newToolObservations: Array<{
    name: string;
    output: unknown;
    args?: Record<string, unknown>;
  }>;
}): ObservationEntry[] {
  const now = new Date().toISOString();
  return input.newToolObservations
    .filter((row) => isLedgerEligibleObservation(row))
    .map((row) => ({
      runId: input.runId,
      turnId: input.turnId,
      name: row.name,
      output: row.output,
      createdAt: now,
      ...(compactArgsForObservation(row.args)
        ? { args: compactArgsForObservation(row.args) }
        : {}),
    }));
}

/** 图启动预载：会话 ledger + 可续跑 activeTask.observationLog（后者覆盖同键）。 */
export function mergePriorToolObservationsFromGoa(
  payload: SessionGoaPayload | null,
): Array<{ name: string; output: unknown }> {
  if (!payload) {
    return [];
  }
  const ledger = payload.sessionObservationLedger ?? [];
  const active = payload.activeTask;
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
  const merged = [...byKey.values()].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  return merged.map((row) => ({ name: row.name, output: row.output }));
}
