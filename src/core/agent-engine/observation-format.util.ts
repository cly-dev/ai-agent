import {
  extractToolErrorUserHint,
  isAgentToolErrorObservation,
} from './agent-run-user-messages.util';
import { isEmptyListToolObservation } from './tool-observation.util';

export type LlmObservationPayload = {
  tool: string;
  success: boolean;
  summary?: Record<string, unknown>;
  records?: Record<string, unknown>[];
  error?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizePayload(output: unknown): unknown {
  if (typeof output !== 'string') {
    return output;
  }
  const trimmed = output.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return output;
  }
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return output;
  }
}

function findListRows(payload: unknown): {
  rows: unknown[];
  total?: number;
} | null {
  if (!isRecord(payload)) {
    return null;
  }
  for (const key of ['data', 'list', 'items', 'records'] as const) {
    const rows = payload[key];
    if (Array.isArray(rows)) {
      const total =
        typeof payload.total === 'number'
          ? payload.total
          : typeof payload.count === 'number'
            ? payload.count
            : undefined;
      return { rows, total };
    }
  }
  return null;
}

function simplifyScalar(value: unknown): unknown {
  if (value == null) {
    return value;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    const row = value as Record<string, unknown>;
    if (typeof row.cent === 'number' && typeof row.currency === 'string') {
      const precision =
        typeof row.precision === 'number' ? row.precision : 2;
      return Number((row.cent / 10 ** precision).toFixed(precision));
    }
  }
  return value;
}

function pathTail(path: string): string {
  const segments = path.split('.').filter(Boolean);
  return segments[segments.length - 1] ?? path;
}

function toObservationFieldKey(path: string): string {
  const tail = pathTail(path);
  const aliases: Record<string, string> = {
    availableTotal: 'availableStock',
    extStock: 'extStock',
    barCode: 'barcode',
    imageUrl: 'image',
    gmtCreate: 'createdAt',
    gmtModify: 'updatedAt',
  };
  return aliases[tail] ?? tail;
}

function getByPath(root: unknown, path: string): unknown {
  const segments = path.split('.').filter(Boolean);
  let current: unknown = root;
  for (const segment of segments) {
    if (current == null) {
      return undefined;
    }
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function isScalarObservationValue(value: unknown): boolean {
  if (value == null) {
    return false;
  }
  const kind = typeof value;
  if (kind === 'string' || kind === 'number' || kind === 'boolean') {
    return true;
  }
  if (kind === 'object' && !Array.isArray(value)) {
    const row = value as Record<string, unknown>;
    return typeof row.cent === 'number';
  }
  return false;
}

function shouldSkipFieldLabelPath(path: string): boolean {
  const normalized = path.toLowerCase();
  return (
    normalized.includes('skus') ||
    normalized.includes('inventories') ||
    normalized === 'data' ||
    normalized === 'items' ||
    normalized === 'list'
  );
}

function flattenRecordForLlm(
  row: Record<string, unknown>,
  fieldLabels: Record<string, string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const path of Object.keys(fieldLabels)) {
    if (shouldSkipFieldLabelPath(path)) {
      continue;
    }
    const value = getByPath(row, path);
    if (!isScalarObservationValue(value)) {
      continue;
    }
    out[toObservationFieldKey(path)] = simplifyScalar(value);
  }

  if (row.id != null && out.id == null) {
    out.id = String(row.id);
  }
  if (typeof row.title === 'string' && out.title == null) {
    out.title = row.title;
  }
  if (row.status != null && out.status == null) {
    out.status = row.status;
  }
  if (typeof row.brand === 'string' && out.brand == null) {
    out.brand = row.brand;
  }
  if (typeof row.supplier === 'string' && out.supplier == null) {
    out.supplier = row.supplier;
  }

  const skus = row.skus;
  if (Array.isArray(skus) && skus.length > 0) {
    const sku = skus[0];
    if (isRecord(sku)) {
      if (sku.barCode != null && out.barcode == null) {
        out.barcode = sku.barCode;
      }
      const inventories = sku.inventories;
      if (Array.isArray(inventories) && inventories.length > 0) {
        const inv = inventories[0];
        if (isRecord(inv)) {
          if (inv.availableTotal != null && out.availableStock == null) {
            out.availableStock = inv.availableTotal;
          }
          if (inv.total != null && out.stock == null) {
            out.stock = inv.total;
          }
          if (inv.extStock != null && out.extStock == null) {
            out.extStock = inv.extStock;
          }
        }
      }
      const discountPrice = sku.discountPrice;
      if (out.price == null && discountPrice != null) {
        out.price = simplifyScalar(discountPrice);
      }
    }
  }

  return out;
}

/** Shape tool output for LLM consumption (not raw API JSON). */
export function formatObservationForLlm(input: {
  toolName: string;
  output: unknown;
  fieldLabels?: Record<string, string>;
}): LlmObservationPayload {
  const fieldLabels = input.fieldLabels ?? {};

  if (isAgentToolErrorObservation(input.output)) {
    return {
      tool: input.toolName,
      success: false,
      error: extractToolErrorUserHint(input.output) ?? 'Tool call failed',
    };
  }

  if (isEmptyListToolObservation(input.output)) {
    return {
      tool: input.toolName,
      success: true,
      summary: { matchedCount: 0 },
      records: [],
    };
  }

  const payload = normalizePayload(input.output);

  const list = findListRows(payload);
  if (list) {
    const records = list.rows
      .filter((row): row is Record<string, unknown> => isRecord(row))
      .map((row) => flattenRecordForLlm(row, fieldLabels))
      .filter((row) => Object.keys(row).length > 0);

    const summary: Record<string, unknown> = {
      matchedCount: records.length,
    };
    if (list.total != null) {
      summary.total = list.total;
    }

    return {
      tool: input.toolName,
      success: true,
      summary,
      records,
    };
  }

  if (isRecord(payload)) {
    const record = flattenRecordForLlm(payload, fieldLabels);
    if (Object.keys(record).length > 0) {
      return {
        tool: input.toolName,
        success: true,
        summary: { matchedCount: 1 },
        records: [record],
      };
    }
  }

  return {
    tool: input.toolName,
    success: true,
    summary: { matchedCount: 0 },
    records: [],
  };
}

export function serializeObservationsBlock(
  payloads: LlmObservationPayload[],
): string {
  return JSON.stringify(dedupeObservationPayloads(payloads), null, 0);
}

function observationPayloadSignature(payload: LlmObservationPayload): string {
  return JSON.stringify({
    tool: payload.tool,
    success: payload.success,
    summary: payload.summary ?? null,
    recordIds: (payload.records ?? []).map((row) => String(row.id ?? '')),
  });
}

export function isSameObservationPayload(
  left: LlmObservationPayload,
  right: LlmObservationPayload,
): boolean {
  return observationPayloadSignature(left) === observationPayloadSignature(right);
}

/** Drop duplicate tool observations (same tool + same record ids). */
export function dedupeObservationPayloads(
  payloads: LlmObservationPayload[],
): LlmObservationPayload[] {
  const seen = new Set<string>();
  const result: LlmObservationPayload[] = [];
  for (const payload of payloads) {
    const signature = observationPayloadSignature(payload);
    if (seen.has(signature)) {
      continue;
    }
    seen.add(signature);
    result.push(payload);
  }
  return result;
}

const DEFAULT_OBSERVATION_RECORD_LIMIT = 8;

/** Trim records inside observations to fit token budget. */
export function truncateObservationPayloads(
  payloads: LlmObservationPayload[],
  maxRecordsPerTool = DEFAULT_OBSERVATION_RECORD_LIMIT,
): LlmObservationPayload[] {
  return payloads.map((payload) => {
    if (!payload.records || payload.records.length <= maxRecordsPerTool) {
      return payload;
    }
    const records = payload.records.slice(0, maxRecordsPerTool);
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
  });
}
