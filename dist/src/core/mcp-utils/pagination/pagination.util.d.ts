import type { ListPaginationCursor, ListPaginationMeta } from './pagination.types';
export declare function resolveMaxListPages(): number;
export declare function resolveMaxListRows(): number;
export declare function resolveGatherMaxPages(pageSize: number): number;
export declare function resolveMaxListHttpPerTurn(): number;
export declare function extractListPaginationMeta(input: {
    output: unknown;
    args?: Record<string, unknown>;
    llmPayload?: {
        summary?: Record<string, unknown>;
    };
}): ListPaginationMeta | null;
export declare function observationNeedsPagedFetch(input: {
    output: unknown;
    args?: Record<string, unknown>;
    llmPayload?: {
        summary?: Record<string, unknown>;
    };
}): boolean;
export declare function buildNextPageToolArgs(args: Record<string, unknown>, cursor: ListPaginationCursor): Record<string, unknown>;
export declare function resolvePaginationCursor(args: Record<string, unknown>, meta: ListPaginationMeta): ListPaginationCursor;
export declare function shouldFetchAnotherPage(meta: ListPaginationMeta): boolean;
