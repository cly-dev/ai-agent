import type { ListPaginationMeta } from '../../../mcp-utils/pagination';
import type { ListMapReduceState, ListPageSourceCache, ListPageSummary, MapReduceGatherPhase } from './list-map-reduce.types';
export declare function createEmptyMapReduceState(pageSize: number): ListMapReduceState;
export declare function recordPageSourceCache(input: {
    state: ListMapReduceState;
    page: number;
    rows: Record<string, unknown>[];
}): ListMapReduceState;
export declare function findPageSourceCache(state: ListMapReduceState, page: number): ListPageSourceCache | undefined;
export declare function recordPageFetch(input: {
    state: ListMapReduceState;
    output: unknown;
    total?: number;
    apiPage?: number;
    pageSize?: number;
}): ListMapReduceState;
export declare function hasReachedMaxListRows(state: ListMapReduceState): boolean;
export declare function pageSummarySucceeded(page: ListPageSummary): boolean;
export declare function resolvePagesNeedingSummary(state: ListMapReduceState): number[];
export declare function needsPaginationResume(state: ListMapReduceState): boolean;
export declare function needsMapSummaryResume(state: ListMapReduceState): boolean;
export declare function mergePageSummaryResults(existing: ListPageSummary[], updated: ListPageSummary[]): ListPageSummary[];
export declare function applyPageSummariesToState(state: ListMapReduceState, pageSummaries: ListPageSummary[]): ListMapReduceState;
export declare function resolveMapReduceFetchComplete(input: {
    state: ListMapReduceState;
    lastPageMeta: ListPaginationMeta | null;
    hitMaxPages: boolean;
    hitHttpBudget: boolean;
    hitMaxRows: boolean;
}): {
    complete: boolean;
    truncated: boolean;
};
export declare function mergeMapReduceStates(base: ListMapReduceState, page: ListMapReduceState): ListMapReduceState;
export declare function buildMapReduceObservationOutput(state: ListMapReduceState): Record<string, unknown>;
export declare function resolveMapReduceGatherPhase(output: unknown): MapReduceGatherPhase;
export declare function formatMapReduceFetchStatusNote(output: unknown): string | null;
export declare function isMapReducePagedGatherResumable(output: unknown): boolean;
export declare function mergeMapReduceObservationOutputs(outputs: unknown[]): Record<string, unknown> | null;
export declare function readMapReduceFromObservation(output: unknown): ListMapReduceState | null;
export declare function collectNotableExamplesFromPageSummaries(pageSummaries: ListPageSummary[], limit?: number): Record<string, unknown>[];
export declare function collectPageFindingsBrief(pageSummaries: ListPageSummary[], limit?: number): string[];
