import {
  extractToolErrorUserHint,
  isAgentToolErrorObservation,
} from './agent-run-user-messages.util';
import type { ToolObservation } from './main/agent-engine.types';
import { isEmptyListToolObservation } from './tool/tool-observation.util';
import { resolveDefaultListArrayLimit } from '../../tool-engine/tool-pagination-params.util';
import {
  collectNotableExamplesFromPageSummaries,
  collectPageFindingsBrief,
  formatMapReduceFetchStatusNote,
} from './gather/list-map-reduce.util';
import { MAP_REDUCE_OUTPUT_KEY } from './gather/list-map-reduce.types';

export type ObservationPromptSource = 'session' | 'current_run';

export type LlmObservationPayload = {
  tool: string;
  /** 本 turn 内已执行过该 tool_call */
  executed: boolean;
  /** session = GOA 预载；current_run = 本 run 新增 */
  source?: ObservationPromptSource;
  /** 本次调用使用的参数（精简后），便于模型避免重复 tool_calls */
  args?: Record<string, unknown>;
  /** 给决策模型的复用说明 */
  reuseNote?: string;
  success: boolean;
  summary?: Record<string, unknown>;
  records?: Record<string, unknown>[];
  error?: string;
};

export type SummarizeMemoryScopeMeta = {
  primarySource: 'current_run' | 'working_memory' | 'both' | 'none';
  reason: string;
  filterMiss?: boolean;
  workingMemoryCount: number;
  currentRunCount: number;
};

export type SplitToolObservationsOutput = {
  workingMemory: ToolObservation[];
  currentRun: ToolObservation[];
  memoryScope?: SummarizeMemoryScopeMeta;
};

export const SPLIT_TOOL_OBSERVATIONS_NAME = 'split_tool_observations';

const OBSERVATION_ARG_SKIP = new Set(['vo', 'X-SHOP-ID', 'page', 'size', 'sort']);
const OBSERVATION_REUSE_NOTE_SUCCESS =
  'This tool already succeeded with the args shown. Do not call it again with the same arguments; answer from this observation.';
const OBSERVATION_REUSE_NOTE_ERROR =
  'This tool already failed with the args shown. Do not repeat the same call; adjust parameters or use observations.';
const OBSERVATION_REUSE_NOTE_SESSION =
  'Preloaded from session working memory. Prefer current_run_observations for the same tool+args when answering the latest request.';

export function compactArgsForObservation(
  args: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!args) {
    return undefined;
  }
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    if (OBSERVATION_ARG_SKIP.has(key)) {
      continue;
    }
    if (value === undefined || value === null || value === '') {
      continue;
    }
    if (typeof value === 'string' && value.length > 120) {
      out[key] = `${value.slice(0, 120)}…`;
      continue;
    }
    out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function buildObservationEnvelope(input: {
  output: unknown;
  args?: Record<string, unknown>;
  source?: ObservationPromptSource;
}): Pick<LlmObservationPayload, 'executed' | 'args' | 'reuseNote' | 'source'> {
  const compactArgs = compactArgsForObservation(input.args);
  const isError = isAgentToolErrorObservation(input.output);
  const reuseNote =
    input.source === 'session'
      ? isError
        ? OBSERVATION_REUSE_NOTE_ERROR
        : OBSERVATION_REUSE_NOTE_SESSION
      : isError
        ? OBSERVATION_REUSE_NOTE_ERROR
        : OBSERVATION_REUSE_NOTE_SUCCESS;
  return {
    executed: true,
    ...(input.source ? { source: input.source } : {}),
    ...(compactArgs ? { args: compactArgs } : {}),
    reuseNote,
  };
}

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
  args?: Record<string, unknown>;
  source?: ObservationPromptSource;
}): LlmObservationPayload {
  const fieldLabels = input.fieldLabels ?? {};
  const envelope = buildObservationEnvelope({
    output: input.output,
    args: input.args,
    source: input.source,
  });

  if (isAgentToolErrorObservation(input.output)) {
    const responseSource =
      typeof input.output.responseSource === 'string' ||
      (input.output.responseSource != null &&
        typeof input.output.responseSource === 'object')
        ? input.output.responseSource
        : undefined;
    return {
      tool: input.toolName,
      ...envelope,
      success: false,
      error: extractToolErrorUserHint(input.output) ?? 'Tool call failed',
      ...(input.output.httpStatus != null
        ? { httpStatus: input.output.httpStatus }
        : {}),
      ...(responseSource !== undefined ? { responseSource } : {}),
    };
  }

  if (isEmptyListToolObservation(input.output)) {
    return {
      tool: input.toolName,
      ...envelope,
      success: true,
      summary: { matchedCount: 0 },
      records: [],
    };
  }

  const payload = normalizePayload(input.output);

  if (isRecord(payload) && isRecord(payload[MAP_REDUCE_OUTPUT_KEY])) {
    const mapReduce = payload[MAP_REDUCE_OUTPUT_KEY];
    const fetchNote = formatMapReduceFetchStatusNote(input.output);
    const pageSummaries = Array.isArray(mapReduce.pageSummaries)
      ? mapReduce.pageSummaries.filter(
          (row): row is Record<string, unknown> => isRecord(row),
        )
      : [];
    const summary: Record<string, unknown> = {
      matchedCount:
        typeof mapReduce.fetchedCount === 'number'
          ? mapReduce.fetchedCount
          : 0,
      mapReduce: true,
      complete: mapReduce.complete === true,
      mapComplete: mapReduce.mapComplete === true,
      pageSummaryCount: pageSummaries.length,
    };
    if (typeof mapReduce.total === 'number') {
      summary.total = mapReduce.total;
    }
    if (typeof mapReduce.maxRows === 'number') {
      summary.maxRows = mapReduce.maxRows;
    }
    if (mapReduce.truncated === true) {
      summary.truncated = true;
    }
    if (mapReduce.truncatedByMaxRows === true) {
      summary.truncatedByMaxRows = true;
    }
    if (mapReduce.mapPartial === true) {
      summary.mapPartial = true;
    }
    if (mapReduce.mapResumeStalled === true) {
      summary.mapResumeStalled = true;
    }
    if (mapReduce.resumeStalled === true) {
      summary.resumeStalled = true;
    }
    if (mapReduce.httpBudgetExhausted === true) {
      summary.httpBudgetExhausted = true;
    }
    if (fetchNote) {
      summary.fetchStatusNote = fetchNote;
    }
    const pageFindings = collectPageFindingsBrief(
      pageSummaries.map((row) => ({
        page: typeof row.page === 'number' ? row.page : 0,
        rowCount: typeof row.rowCount === 'number' ? row.rowCount : 0,
        summary: isRecord(row.summary) ? row.summary : undefined,
        error: typeof row.error === 'string' ? row.error : undefined,
      })),
    );
    if (pageFindings.length > 0) {
      summary.pageFindings = pageFindings;
    }
    const records = collectNotableExamplesFromPageSummaries(
      pageSummaries.map((row) => ({
        page: typeof row.page === 'number' ? row.page : 0,
        rowCount: typeof row.rowCount === 'number' ? row.rowCount : 0,
        summary: isRecord(row.summary) ? row.summary : undefined,
        error: typeof row.error === 'string' ? row.error : undefined,
      })),
    )
      .map((row) => flattenRecordForLlm(row, fieldLabels))
      .filter((row) => Object.keys(row).length > 0);
    return {
      tool: input.toolName,
      ...envelope,
      success: true,
      summary,
      records,
    };
  }

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
      ...envelope,
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
        ...envelope,
        success: true,
        summary: { matchedCount: 1 },
        records: [record],
      };
    }
  }

  return {
    tool: input.toolName,
    ...envelope,
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

export function observationCallSignature(
  payload: Pick<LlmObservationPayload, 'tool' | 'args'>,
): string {
  return JSON.stringify({
    tool: payload.tool,
    args: payload.args ?? null,
  });
}

function observationPayloadSignature(payload: LlmObservationPayload): string {
  return JSON.stringify({
    tool: payload.tool,
    success: payload.success,
    args: payload.args ?? null,
    summary: payload.summary ?? null,
    recordIds: (payload.records ?? []).map((row) => String(row.id ?? '')),
  });
}

export function toolObservationsToPayloads(
  observations: ToolObservation[],
  source?: ObservationPromptSource,
): LlmObservationPayload[] {
  return observations.map((observation) => {
    const existing = observation.llmPayload;
    const payload =
      existing ??
      formatObservationForLlm({
        toolName: observation.name,
        output: observation.output,
        fieldLabels: observation.fieldLabels,
        source,
      });
    if (!source || payload.source === source) {
      return payload;
    }
    const reuseNote =
      source === 'session'
        ? payload.success === false
          ? OBSERVATION_REUSE_NOTE_ERROR
          : OBSERVATION_REUSE_NOTE_SESSION
        : payload.reuseNote;
    return { ...payload, source, reuseNote };
  });
}

/** current_run 与 working memory 同工具同参时，去掉 session 侧冗余项。 */
export function filterWorkingMemorySupersededByCurrentRun(
  workingMemory: LlmObservationPayload[],
  currentRun: LlmObservationPayload[],
): LlmObservationPayload[] {
  const currentSignatures = new Set(
    currentRun.map((row) => observationCallSignature(row)),
  );
  return workingMemory.filter(
    (row) => !currentSignatures.has(observationCallSignature(row)),
  );
}

export function formatSplitObservationsPromptBlock(input: {
  workingMemory: LlmObservationPayload[];
  currentRun: LlmObservationPayload[];
}): string {
  const working = dedupeObservationPayloads(
    filterWorkingMemorySupersededByCurrentRun(
      input.workingMemory,
      input.currentRun,
    ),
  );
  const current = dedupeObservationPayloads(input.currentRun);
  const parts: string[] = [
    'Answer the latest request from current_run_observations first; working_memory_observations is session context only.',
  ];
  parts.push(
    `<working_memory_observations>\n${working.length > 0 ? serializeObservationsBlock(working) : '[]'}\n</working_memory_observations>`,
  );
  parts.push(
    `<current_run_observations>\n${current.length > 0 ? serializeObservationsBlock(current) : '[]'}\n</current_run_observations>`,
  );
  return parts.join('\n');
}

export function isSplitToolObservationsOutput(
  output: unknown,
): output is SplitToolObservationsOutput {
  if (output == null || typeof output !== 'object' || Array.isArray(output)) {
    return false;
  }
  const row = output as Record<string, unknown>;
  return Array.isArray(row.workingMemory) && Array.isArray(row.currentRun);
}

function readScopedObservations(
  output: SplitToolObservationsOutput,
  source: 'current_run' | 'working_memory',
): ToolObservation[] {
  const scoped =
    output.memoryScope?.primarySource === 'current_run'
      ? output.currentRun
      : output.memoryScope?.primarySource === 'working_memory'
        ? output.workingMemory
        : null;
  if (scoped != null) {
    return scoped;
  }
  return source === 'current_run' ? output.currentRun : output.workingMemory;
}

export function formatSplitToolObservationsForSummarize(
  output: SplitToolObservationsOutput,
): string {
  return formatSplitObservationsPromptBlock({
    workingMemory: toolObservationsToPayloads(
      output.workingMemory,
      'session',
    ),
    currentRun: toolObservationsToPayloads(output.currentRun, 'current_run'),
  });
}

/** summarize 规则化 table：尊重 memoryScope，否则 current_run 优先。 */
export function resolvePrimaryObservationForSummarize(
  output: unknown,
): ToolObservation | null {
  if (!isSplitToolObservationsOutput(output)) {
    return null;
  }
  const primarySource = output.memoryScope?.primarySource;
  if (primarySource === 'none') {
    return null;
  }
  if (primarySource === 'working_memory') {
    const scoped = readScopedObservations(output, 'working_memory');
    return scoped[scoped.length - 1] ?? null;
  }
  if (primarySource === 'current_run') {
    const scoped = readScopedObservations(output, 'current_run');
    return scoped[scoped.length - 1] ?? null;
  }
  if (output.currentRun.length > 0) {
    return output.currentRun[output.currentRun.length - 1] ?? null;
  }
  if (output.workingMemory.length > 0) {
    return output.workingMemory[output.workingMemory.length - 1] ?? null;
  }
  return null;
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

/** Trim records inside observations to fit token budget. */
export function truncateObservationPayloads(
  payloads: LlmObservationPayload[],
  maxRecordsPerTool = resolveDefaultListArrayLimit(),
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
