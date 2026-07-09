export type ListPageSummary = {
    page: number;
    rowCount: number;
    summary?: Record<string, unknown>;
    error?: string;
    errorDetail?: string;
};
export type ListPageSourceCache = {
    page: number;
    rowCount: number;
    rows: Record<string, unknown>[];
};
export type MapReduceGatherPhase = 'none' | 'complete' | 'partial' | 'resumable';
export type ListMapReduceState = {
    total?: number;
    fetchedCount: number;
    pageCount: number;
    fetchedApiPages: number[];
    lastApiPage?: number;
    pageSize: number;
    maxRows: number;
    pageSummaries: ListPageSummary[];
    pageSourceByApiPage?: ListPageSourceCache[];
    mapComplete: boolean;
    mapPartial?: boolean;
    complete: boolean;
    truncated?: boolean;
    truncatedByMaxRows?: boolean;
    lastPageFingerprint?: string | null;
    resumeStalled?: boolean;
    mapResumeStalled?: boolean;
    httpBudgetExhausted?: boolean;
};
export declare const MAP_REDUCE_OUTPUT_KEY = "__mapReduce";
