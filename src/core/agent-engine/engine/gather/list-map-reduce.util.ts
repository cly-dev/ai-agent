import type { ListPaginationMeta } from '../../../mcp-utils/pagination';
import {
  resolveGatherMaxPages,
  resolveMaxListRows,
  shouldFetchAnotherPage,
} from '../../../mcp-utils/pagination';
import { extractListRowsFromToolOutput } from '../message/message-blocks.util';
import type {
  ListMapReduceState,
  ListPageSourceCache,
  ListPageSummary,
  MapReduceGatherPhase,
} from './list-map-reduce.types';
import { MAP_REDUCE_OUTPUT_KEY } from './list-map-reduce.types';
import { prepareRowsForPageSummary } from './list-page-summary.util';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export function createEmptyMapReduceState(pageSize: number): ListMapReduceState {
  return {
    fetchedCount: 0,
    pageCount: 0,
    fetchedApiPages: [],
    pageSize,
    maxRows: resolveMaxListRows(),
    pageSummaries: [],
    mapComplete: false,
    complete: false,
  };
}

/** Record one fetched list page (counts only — semantic map is LLM pageSummary). */
function mergePageSourceCaches(
  left: ListPageSourceCache[] | undefined,
  right: ListPageSourceCache[] | undefined,
): ListPageSourceCache[] | undefined {
  const byPage = new Map<number, ListPageSourceCache>();
  for (const row of left ?? []) {
    byPage.set(row.page, row);
  }
  for (const row of right ?? []) {
    byPage.set(row.page, row);
  }
  if (byPage.size === 0) {
    return undefined;
  }
  return [...byPage.values()].sort((a, b) => a.page - b.page);
}

/** Cache sanitized rows so map-summary retry does not re-fetch HTTP. */
export function recordPageSourceCache(input: {
  state: ListMapReduceState;
  page: number;
  rows: Record<string, unknown>[];
}): ListMapReduceState {
  const prepared = prepareRowsForPageSummary(input.rows);
  const entry: ListPageSourceCache = {
    page: input.page,
    rowCount: prepared.originalRowCount,
    rows: prepared.rows,
  };
  return {
    ...input.state,
    pageSourceByApiPage: mergePageSourceCaches(input.state.pageSourceByApiPage, [
      entry,
    ]),
  };
}

export function findPageSourceCache(
  state: ListMapReduceState,
  page: number,
): ListPageSourceCache | undefined {
  return state.pageSourceByApiPage?.find((row) => row.page === page);
}

export function recordPageFetch(input: {
  state: ListMapReduceState;
  output: unknown;
  total?: number;
  apiPage?: number;
  pageSize?: number;
}): ListMapReduceState {
  const rows = extractListRowsFromToolOutput(input.output);
  const fetchedApiPages =
    input.apiPage != null
      ? [...input.state.fetchedApiPages, input.apiPage]
      : [...input.state.fetchedApiPages];
  return {
    ...input.state,
    pageCount: input.state.pageCount + 1,
    fetchedCount: input.state.fetchedCount + rows.length,
    fetchedApiPages,
    total: input.total ?? input.state.total,
    lastApiPage: input.apiPage ?? input.state.lastApiPage,
    pageSize:
      input.pageSize != null && input.pageSize > 0
        ? input.pageSize
        : input.state.pageSize,
  };
}

export function hasReachedMaxListRows(state: ListMapReduceState): boolean {
  return state.fetchedCount >= state.maxRows;
}

export function pageSummarySucceeded(page: ListPageSummary): boolean {
  return page.error == null && page.summary != null;
}

/** Pages that need (re-)summary: missing, failed, or empty findings. */
export function resolvePagesNeedingSummary(
  state: ListMapReduceState,
): number[] {
  const okPages = new Set(
    state.pageSummaries.filter(pageSummarySucceeded).map((row) => row.page),
  );
  const candidates =
    state.fetchedApiPages.length > 0
      ? [...state.fetchedApiPages]
      : state.pageSummaries.map((row) => row.page);
  const unique = [...new Set(candidates)].sort((left, right) => left - right);
  return unique.filter((page) => !okPages.has(page));
}

export function needsPaginationResume(state: ListMapReduceState): boolean {
  return !state.complete && state.fetchedCount > 0 && !state.resumeStalled;
}

export function needsMapSummaryResume(state: ListMapReduceState): boolean {
  if (state.mapResumeStalled) {
    return false;
  }
  if (!state.complete) {
    return false;
  }
  return resolvePagesNeedingSummary(state).length > 0;
}

export function mergePageSummaryResults(
  existing: ListPageSummary[],
  updated: ListPageSummary[],
): ListPageSummary[] {
  const byPage = new Map<number, ListPageSummary>();
  for (const row of existing) {
    byPage.set(row.page, row);
  }
  for (const row of updated) {
    byPage.set(row.page, row);
  }
  return [...byPage.values()].sort((left, right) => left.page - right.page);
}

export function applyPageSummariesToState(
  state: ListMapReduceState,
  pageSummaries: ListPageSummary[],
): ListMapReduceState {
  const failed = pageSummaries.some((row) => row.error != null);
  const succeeded = pageSummaries.filter(pageSummarySucceeded).length;
  const expectedPages =
    state.fetchedApiPages.length > 0
      ? state.fetchedApiPages.length
      : state.pageCount;
  return {
    ...state,
    pageSummaries,
    mapComplete: succeeded >= expectedPages && expectedPages > 0,
    mapPartial: failed ? true : state.mapPartial,
  };
}

export function resolveMapReduceFetchComplete(input: {
  state: ListMapReduceState;
  lastPageMeta: ListPaginationMeta | null;
  hitMaxPages: boolean;
  hitHttpBudget: boolean;
  hitMaxRows: boolean;
}): { complete: boolean; truncated: boolean } {
  const truncated =
    input.hitMaxPages ||
    input.hitHttpBudget ||
    input.hitMaxRows ||
    (input.state.total != null &&
      input.state.fetchedCount < input.state.total);
  let complete = false;
  if (input.hitMaxRows) {
    complete = input.state.fetchedCount > 0;
  } else if (input.state.total != null) {
    complete = input.state.fetchedCount >= input.state.total;
  } else if (input.lastPageMeta != null) {
    complete = !shouldFetchAnotherPage(input.lastPageMeta);
  } else {
    complete = !truncated && input.state.fetchedCount > 0;
  }
  return { complete, truncated };
}

export function mergeMapReduceStates(
  base: ListMapReduceState,
  page: ListMapReduceState,
): ListMapReduceState {
  const mergedPageSummaries = mergePageSummaryResults(
    base.pageSummaries,
    page.pageSummaries,
  );
  return {
    ...base,
    fetchedCount: base.fetchedCount + page.fetchedCount,
    pageCount: base.pageCount + page.pageCount,
    fetchedApiPages: [...base.fetchedApiPages, ...page.fetchedApiPages],
    pageSummaries: mergedPageSummaries,
    total: page.total ?? base.total,
    pageSize: page.pageSize > 0 ? page.pageSize : base.pageSize,
    lastApiPage: page.lastApiPage ?? base.lastApiPage,
    mapComplete: base.mapComplete && page.mapComplete,
    mapPartial: base.mapPartial === true || page.mapPartial === true,
    complete: page.complete || base.complete,
    truncated: page.truncated === true || base.truncated === true,
    truncatedByMaxRows:
      page.truncatedByMaxRows === true || base.truncatedByMaxRows === true,
    lastPageFingerprint: page.lastPageFingerprint ?? base.lastPageFingerprint,
    resumeStalled: page.resumeStalled ?? base.resumeStalled,
    mapResumeStalled: page.mapResumeStalled ?? base.mapResumeStalled,
    httpBudgetExhausted:
      page.httpBudgetExhausted === true || base.httpBudgetExhausted === true,
    pageSourceByApiPage: mergePageSourceCaches(
      base.pageSourceByApiPage,
      page.pageSourceByApiPage,
    ),
  };
}

export function buildMapReduceObservationOutput(
  state: ListMapReduceState,
): Record<string, unknown> {
  const mapReduce = {
    complete: state.complete,
    mapComplete: state.mapComplete,
    truncated: state.truncated === true,
    truncatedByMaxRows: state.truncatedByMaxRows === true,
    maxRows: state.maxRows,
    total: state.total,
    fetchedCount: state.fetchedCount,
    pageCount: state.pageCount,
    fetchedApiPages: state.fetchedApiPages,
    ...(state.lastApiPage != null ? { lastApiPage: state.lastApiPage } : {}),
    pageSize: state.pageSize,
    pageSummaries: state.pageSummaries,
    ...(state.mapPartial === true ? { mapPartial: true } : {}),
    ...(state.lastPageFingerprint != null
      ? { lastPageFingerprint: state.lastPageFingerprint }
      : {}),
    ...(state.resumeStalled === true ? { resumeStalled: true } : {}),
    ...(state.mapResumeStalled === true ? { mapResumeStalled: true } : {}),
    ...(state.httpBudgetExhausted === true
      ? { httpBudgetExhausted: true }
      : {}),
    ...(state.mapComplete !== true && state.pageSourceByApiPage != null
      ? { pageSourceByApiPage: state.pageSourceByApiPage }
      : {}),
  };
  const notableRows = collectNotableExamplesFromPageSummaries(
    state.pageSummaries,
    12,
  );
  return {
    [MAP_REDUCE_OUTPUT_KEY]: mapReduce,
    pageSummaries: state.pageSummaries,
    data: notableRows,
    total: state.total ?? state.fetchedCount,
    matchedCount: state.fetchedCount,
  };
}

function isPartialMapReduceState(state: ListMapReduceState): boolean {
  if (state.fetchedCount <= 0) {
    return false;
  }
  if (
    state.mapResumeStalled === true ||
    state.resumeStalled === true ||
    state.httpBudgetExhausted === true
  ) {
    return true;
  }
  if (!state.complete && state.truncated === true) {
    return state.pageCount >= resolveGatherMaxPages(state.pageSize);
  }
  return false;
}

export function resolveMapReduceGatherPhase(
  output: unknown,
): MapReduceGatherPhase {
  const state = readMapReduceFromObservation(output);
  if (!state) {
    return 'none';
  }
  if (state.complete && state.mapComplete) {
    return 'complete';
  }
  if (isPartialMapReduceState(state)) {
    return 'partial';
  }
  if (needsPaginationResume(state) || needsMapSummaryResume(state)) {
    return 'resumable';
  }
  if (state.complete && !state.mapComplete) {
    return 'partial';
  }
  return 'partial';
}

export function formatMapReduceFetchStatusNote(output: unknown): string | null {
  const state = readMapReduceFromObservation(output);
  if (!state) {
    return null;
  }
  if (
    state.complete &&
    state.mapComplete &&
    state.truncated !== true &&
    state.resumeStalled !== true &&
    state.mapResumeStalled !== true
  ) {
    return null;
  }
  const lines: string[] = [];
  if (state.truncatedByMaxRows === true) {
    lines.push(
      `List fetch capped at ${state.maxRows} records: collected ${state.fetchedCount}${
        state.total != null ? ` of ${state.total} total` : ''
      }. Analysis is based on this sample; tell the user when total exceeds the cap.`,
    );
  } else if (state.truncated === true || state.resumeStalled === true) {
    lines.push(
      `List fetch incomplete: collected ${state.fetchedCount}${
        state.total != null ? `/${state.total}` : ''
      } records across ${state.pageCount} page(s). Analysis is based on partial data.`,
    );
  }
  if (state.mapPartial === true) {
    lines.push('Some page summaries failed; analysis may be incomplete.');
  } else if (!state.mapComplete && state.complete) {
    lines.push('Page summaries are still pending.');
  }
  if (state.mapResumeStalled === true) {
    lines.push('Page summary retry stalled; proceeding with partial summaries.');
  }
  if (state.resumeStalled === true) {
    lines.push('Pagination stalled because no new pages were returned.');
  }
  if (state.httpBudgetExhausted === true) {
    lines.push('Pagination stopped because the per-turn HTTP budget was exhausted.');
  } else if (
    state.truncated === true &&
    state.truncatedByMaxRows !== true &&
    state.resumeStalled !== true
  ) {
    lines.push('Results may be truncated at the engine page cap.');
  }
  return lines.length > 0 ? lines.join(' ') : null;
}

export function isMapReducePagedGatherResumable(output: unknown): boolean {
  return resolveMapReduceGatherPhase(output) === 'resumable';
}

export function mergeMapReduceObservationOutputs(
  outputs: unknown[],
): Record<string, unknown> | null {
  let merged: ListMapReduceState | null = null;
  for (const output of outputs) {
    const state = readMapReduceFromObservation(output);
    if (!state) {
      continue;
    }
    merged = merged == null ? state : mergeMapReduceStates(merged, state);
  }
  if (!merged) {
    return null;
  }
  return buildMapReduceObservationOutput(merged);
}

function readPageSummaries(value: unknown): ListPageSummary[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: ListPageSummary[] = [];
  for (const row of value) {
    if (!isRecord(row) || typeof row.page !== 'number') {
      continue;
    }
    out.push({
      page: row.page,
      rowCount: typeof row.rowCount === 'number' ? row.rowCount : 0,
      summary: isRecord(row.summary) ? row.summary : undefined,
      error: typeof row.error === 'string' ? row.error : undefined,
      errorDetail:
        typeof row.errorDetail === 'string' ? row.errorDetail : undefined,
    });
  }
  return out;
}

function readPageSourceCaches(value: unknown): ListPageSourceCache[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const out: ListPageSourceCache[] = [];
  for (const row of value) {
    if (!isRecord(row) || typeof row.page !== 'number' || !Array.isArray(row.rows)) {
      continue;
    }
    const rows = row.rows.filter(
      (item): item is Record<string, unknown> => isRecord(item),
    );
    out.push({
      page: row.page,
      rowCount:
        typeof row.rowCount === 'number' ? row.rowCount : rows.length,
      rows,
    });
  }
  return out.length > 0 ? out : undefined;
}

function readFetchedApiPages(value: unknown, pageCount: number): number[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const pages = value.filter(
    (row): row is number => typeof row === 'number' && Number.isFinite(row),
  );
  if (pages.length > 0) {
    return pages;
  }
  if (pageCount > 0) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  return [];
}

export function readMapReduceFromObservation(
  output: unknown,
): ListMapReduceState | null {
  if (!isRecord(output)) {
    return null;
  }
  const mapReduce = output[MAP_REDUCE_OUTPUT_KEY];
  if (!isRecord(mapReduce)) {
    return null;
  }
  const pageCount =
    typeof mapReduce.pageCount === 'number' ? mapReduce.pageCount : 0;
  const pageSummaries = readPageSummaries(
    mapReduce.pageSummaries ?? output.pageSummaries,
  );
  return {
    total:
      typeof mapReduce.total === 'number' ? mapReduce.total : undefined,
    fetchedCount:
      typeof mapReduce.fetchedCount === 'number' ? mapReduce.fetchedCount : 0,
    pageCount,
    fetchedApiPages: readFetchedApiPages(mapReduce.fetchedApiPages, pageCount),
    lastApiPage:
      typeof mapReduce.lastApiPage === 'number' ? mapReduce.lastApiPage : undefined,
    pageSize:
      typeof mapReduce.pageSize === 'number' ? mapReduce.pageSize : 0,
    maxRows:
      typeof mapReduce.maxRows === 'number'
        ? mapReduce.maxRows
        : resolveMaxListRows(),
    pageSummaries,
    pageSourceByApiPage: readPageSourceCaches(mapReduce.pageSourceByApiPage),
    mapComplete: mapReduce.mapComplete === true,
    mapPartial: mapReduce.mapPartial === true,
    complete: mapReduce.complete === true,
    truncated: mapReduce.truncated === true,
    truncatedByMaxRows: mapReduce.truncatedByMaxRows === true,
    lastPageFingerprint:
      typeof mapReduce.lastPageFingerprint === 'string'
        ? mapReduce.lastPageFingerprint
        : null,
    resumeStalled: mapReduce.resumeStalled === true,
    mapResumeStalled: mapReduce.mapResumeStalled === true,
    httpBudgetExhausted: mapReduce.httpBudgetExhausted === true,
  };
}

export function collectNotableExamplesFromPageSummaries(
  pageSummaries: ListPageSummary[],
  limit = 6,
): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const page of pageSummaries) {
    const examples = page.summary?.notableExamples;
    if (!Array.isArray(examples)) {
      continue;
    }
    for (const row of examples) {
      if (!isRecord(row)) {
        continue;
      }
      out.push({
        ...row,
        page: page.page,
      });
      if (out.length >= limit) {
        return out;
      }
    }
  }
  return out;
}

export function collectPageFindingsBrief(
  pageSummaries: ListPageSummary[],
  limit = 15,
): string[] {
  const out: string[] = [];
  for (const page of pageSummaries) {
    const findings = page.summary?.keyFindings;
    if (!Array.isArray(findings)) {
      continue;
    }
    for (const finding of findings) {
      if (typeof finding !== 'string' || finding.trim().length === 0) {
        continue;
      }
      out.push(`[p${page.page}] ${finding.trim()}`);
      if (out.length >= limit) {
        return out;
      }
    }
  }
  return out;
}
