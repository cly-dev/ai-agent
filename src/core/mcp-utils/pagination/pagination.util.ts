import {
  classifyPaginationParam,
  resolveDefaultListPage,
  resolveDefaultListSize,
} from '../../tool-engine/tool-pagination-params.util';
import type { ListPaginationCursor, ListPaginationMeta } from './pagination.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
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

function readPositiveInt(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 1) {
    return Math.trunc(value);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseInt(value.trim(), 10);
    if (Number.isFinite(parsed) && parsed >= 1) {
      return parsed;
    }
  }
  return fallback;
}

function resolvePageParamName(args: Record<string, unknown>): string {
  for (const key of Object.keys(args)) {
    if (classifyPaginationParam(key) === 'page') {
      return key;
    }
  }
  return 'page';
}

function resolveSizeParamName(args: Record<string, unknown>): string {
  for (const key of Object.keys(args)) {
    if (classifyPaginationParam(key) === 'size') {
      return key;
    }
  }
  return 'size';
}

function readPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : fallback;
}

/** Max pages per gather round including the first fetch (env `TOOL_LIST_MAX_PAGES`, default 10). */
export function resolveMaxListPages(): number {
  return readPositiveIntEnv('TOOL_LIST_MAX_PAGES', 10);
}

/** Max rows engine will fetch per gather (env `TOOL_LIST_MAX_ROWS`, default 1000). */
export function resolveMaxListRows(): number {
  return readPositiveIntEnv('TOOL_LIST_MAX_ROWS', 1000);
}

/** Pages allowed for one gather: enough to reach MAX_ROWS, with configured cap as floor. */
export function resolveGatherMaxPages(pageSize: number): number {
  const maxRows = resolveMaxListRows();
  const configured = resolveMaxListPages();
  const rowsNeededPages = Math.ceil(maxRows / Math.max(1, pageSize));
  return Math.max(configured, rowsNeededPages);
}

/** Max engine-driven list HTTP calls per agent turn (env `TOOL_LIST_MAX_HTTP_PER_TURN`, default 60). */
export function resolveMaxListHttpPerTurn(): number {
  return readPositiveIntEnv('TOOL_LIST_MAX_HTTP_PER_TURN', 60);
}

function readTotalFromLlmPayload(
  llmPayload: { summary?: Record<string, unknown> } | undefined,
): number | undefined {
  const total = llmPayload?.summary?.total;
  return typeof total === 'number' && Number.isFinite(total) ? total : undefined;
}

function isMapReduceOutputComplete(output: unknown): boolean {
  if (!isRecord(output)) {
    return false;
  }
  const mapReduce = output.__mapReduce;
  return (
    isRecord(mapReduce) &&
    mapReduce.complete === true &&
    mapReduce.mapComplete === true
  );
}

export function extractListPaginationMeta(input: {
  output: unknown;
  args?: Record<string, unknown>;
  llmPayload?: { summary?: Record<string, unknown> };
}): ListPaginationMeta | null {
  const payload = normalizePayload(input.output);
  const list = findListRows(payload);
  if (!list) {
    return null;
  }
  const args = input.args ?? {};
  const pageParam = resolvePageParamName(args);
  const sizeParam = resolveSizeParamName(args);
  const page = readPositiveInt(args[pageParam], resolveDefaultListPage());
  const pageSize = readPositiveInt(args[sizeParam], resolveDefaultListSize());
  const rowCount = list.rows.length;
  const total = list.total ?? readTotalFromLlmPayload(input.llmPayload);
  const fetchedSoFar = (page - 1) * pageSize + rowCount;
  const hasMore =
    total != null ? fetchedSoFar < total : rowCount >= pageSize;

  return {
    total,
    page,
    pageSize,
    rowCount,
    hasMore,
    pageParam,
    sizeParam,
  };
}

/** True when observation still needs engine-driven paging (no completed __mapReduce). */
export function observationNeedsPagedFetch(input: {
  output: unknown;
  args?: Record<string, unknown>;
  llmPayload?: { summary?: Record<string, unknown> };
}): boolean {
  if (isMapReduceOutputComplete(input.output)) {
    return false;
  }
  const meta = extractListPaginationMeta(input);
  if (!meta || !meta.hasMore) {
    return false;
  }
  if (meta.total != null && meta.total <= meta.pageSize) {
    return false;
  }
  return true;
}

export function buildNextPageToolArgs(
  args: Record<string, unknown>,
  cursor: ListPaginationCursor,
): Record<string, unknown> {
  return {
    ...args,
    [cursor.pageParam]: cursor.nextPage,
    [cursor.sizeParam]: cursor.pageSize,
  };
}

export function resolvePaginationCursor(
  args: Record<string, unknown>,
  meta: ListPaginationMeta,
): ListPaginationCursor {
  return {
    pageParam: meta.pageParam,
    sizeParam: meta.sizeParam,
    nextPage: meta.page + 1,
    pageSize: meta.pageSize,
  };
}

export function shouldFetchAnotherPage(meta: ListPaginationMeta): boolean {
  return meta.hasMore && meta.rowCount > 0;
}
