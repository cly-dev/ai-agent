/** Per-page LLM map summary (business-agnostic structured output). */
export type ListPageSummary = {
  page: number;
  rowCount: number;
  summary?: Record<string, unknown>;
  error?: string;
  /** Human-readable failure detail for agentRun / logs. */
  errorDetail?: string;
};

/** Sanitized rows kept for page-summary retry without re-fetching HTTP. */
export type ListPageSourceCache = {
  page: number;
  rowCount: number;
  rows: Record<string, unknown>[];
};

/** __mapReduce 分页生命周期（Plan / 续拉路由单一判定入口）。 */
export type MapReduceGatherPhase =
  | 'none'
  | 'complete'
  | 'partial'
  | 'resumable';

export type ListMapReduceState = {
  total?: number;
  fetchedCount: number;
  pageCount: number;
  /** 已拉取的 API page 参数列表（用于摘要补跑）。 */
  fetchedApiPages: number[];
  /** 最后一页 API 的 page 参数（续拉游标，区别于 pageCount）。 */
  lastApiPage?: number;
  pageSize: number;
  maxRows: number;
  pageSummaries: ListPageSummary[];
  /** Per API page payload for map-summary retry (stripped once mapComplete). */
  pageSourceByApiPage?: ListPageSourceCache[];
  mapComplete: boolean;
  mapPartial?: boolean;
  complete: boolean;
  truncated?: boolean;
  truncatedByMaxRows?: boolean;
  /** 最后一页首行指纹，续拉时用于重复页检测。 */
  lastPageFingerprint?: string | null;
  /** 续拉无进展后为 true，避免 tools/resultCheck 死循环。 */
  resumeStalled?: boolean;
  /** 分页已完成但页内摘要补跑仍无进展。 */
  mapResumeStalled?: boolean;
  /** 本 turn 引擎分页 HTTP 预算用尽。 */
  httpBudgetExhausted?: boolean;
};

export const MAP_REDUCE_OUTPUT_KEY = '__mapReduce';
