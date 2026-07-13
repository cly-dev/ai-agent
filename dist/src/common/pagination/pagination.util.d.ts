import type { PaginatedResult, ResolvedPagination } from './pagination.types';
export declare function resolvePagination(page?: number, pageSize?: number): ResolvedPagination;
export declare function toPaginatedResult<T>(items: T[], total: number, page: number, pageSize: number): PaginatedResult<T>;
export declare function resolveSortOrder(order?: string): 'asc' | 'desc';
