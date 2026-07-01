import type { ObservationPayload } from './prompt-budget.types';
import {
  getPromptObsFieldPreviewChars,
  getPromptObsLongFieldThreshold,
  getPromptObsMaxRecordsL1,
} from './prompt-budget.constants';

const INVENTORY_REUSE_NOTE =
  'Full output stored in session ledger. Re-call with the same args only if preview is insufficient.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function previewLongStringField(
  record: Record<string, unknown>,
  key: string,
  previewChars: number,
): void {
  const value = record[key];
  if (typeof value !== 'string') {
    return;
  }
  if (value.length <= getPromptObsLongFieldThreshold()) {
    return;
  }
  record[`${key}Preview`] = `${value.slice(0, previewChars)}…`;
  record[`${key}Length`] = value.length;
  delete record[key];
}

function degradeRecordFields(
  record: Record<string, unknown>,
  level: 2,
): Record<string, unknown> {
  const out = { ...record };
  for (const key of Object.keys(out)) {
    previewLongStringField(out, key, getPromptObsFieldPreviewChars());
  }
  out._degraded = { level, mode: 'field_preview' };
  return out;
}

function degradeObservationL1(payload: ObservationPayload): ObservationPayload {
  if (!payload.records || payload.records.length === 0) {
    return payload;
  }
  const maxRecords = getPromptObsMaxRecordsL1();
  if (payload.records.length <= maxRecords) {
    return payload;
  }
  const records = payload.records.slice(0, maxRecords);
  return {
    ...payload,
    records,
    summary: {
      ...(payload.summary ?? {}),
      matchedCount: records.length,
      truncated: true,
      totalRecords: payload.records.length,
    },
  };
}

function degradeObservationL2(payload: ObservationPayload): ObservationPayload {
  const summary = payload.summary ?? {};
  if (summary.mapReduce === true || summary.pageSummaryCount != null) {
    return {
      ...payload,
      records: (payload.records ?? [])
        .slice(0, 3)
        .map((row) => (isRecord(row) ? degradeRecordFields(row, 2) : row)),
      summary: {
        ...summary,
        degraded: true,
        degradeLevel: 2,
      },
    };
  }
  if (payload.records && payload.records.length > 0) {
    const records = payload.records.map((row) =>
      isRecord(row) ? degradeRecordFields(row, 2) : row,
    );
    return {
      ...payload,
      records,
      summary: {
        ...summary,
        matchedCount: records.length,
        degraded: true,
        degradeLevel: 2,
      },
    };
  }
  return payload;
}

function degradeObservationL3(payload: ObservationPayload): ObservationPayload {
  const rowCount =
    payload.records?.length ??
    (typeof payload.summary?.matchedCount === 'number'
      ? payload.summary.matchedCount
      : undefined);
  return {
    tool: payload.tool,
    executed: payload.executed ?? true,
    source: payload.source,
    args: payload.args,
    success: payload.success ?? true,
    reuseNote: payload.reuseNote ?? INVENTORY_REUSE_NOTE,
    summary: {
      matchedCount: rowCount ?? 0,
      inventory: true,
      degraded: true,
      degradeLevel: 3,
    },
  };
}

export function degradeObservations(
  observations: ObservationPayload[],
  level: 1 | 2 | 3,
): ObservationPayload[] {
  if (level === 1) {
    return observations.map(degradeObservationL1);
  }
  if (level === 2) {
    return observations.map(degradeObservationL2);
  }
  return observations.map(degradeObservationL3);
}

export function parseObservationsJson(raw: string): ObservationPayload[] {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '[]') {
    return [];
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (row): row is ObservationPayload =>
        row != null && typeof row === 'object' && typeof (row as ObservationPayload).tool === 'string',
    );
  } catch {
    return [];
  }
}

/** Parse observation JSON; on failure keep raw text so the model still sees tool output. */
export function resolveObservationBlockPayload(
  raw: string,
): import('./prompt-budget.types').PromptBlockPayload {
  const observations = parseObservationsJson(raw);
  if (observations.length > 0) {
    return { type: 'observations', observations };
  }
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '[]') {
    return { type: 'observations', observations: [] };
  }
  return { type: 'text', text: trimmed };
}

export function serializeObservationsJson(
  observations: ObservationPayload[],
): string {
  return JSON.stringify(observations);
}
