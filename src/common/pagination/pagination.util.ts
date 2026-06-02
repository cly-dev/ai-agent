import type { PaginatedResult, ResolvedPagination } from './pagination.types';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function resolvePagination(
  page?: number,
  pageSize?: number,
): ResolvedPagination {
  const resolvedPage =
    page != null && Number.isFinite(page) && page >= 1
      ? Math.floor(page)
      : DEFAULT_PAGE;
  const rawSize =
    pageSize != null && Number.isFinite(pageSize) && pageSize >= 1
      ? Math.floor(pageSize)
      : DEFAULT_PAGE_SIZE;
  const resolvedPageSize = Math.min(rawSize, MAX_PAGE_SIZE);
  return {
    page: resolvedPage,
    pageSize: resolvedPageSize,
    skip: (resolvedPage - 1) * resolvedPageSize,
    take: resolvedPageSize,
  };
}

export function toPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  };
}

export function resolveSortOrder(order?: string): 'asc' | 'desc' {
  return order?.toLowerCase() === 'asc' ? 'asc' : 'desc';
}
