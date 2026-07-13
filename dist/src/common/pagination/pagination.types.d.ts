export type PaginatedResult<T> = {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
};
export type ResolvedPagination = {
    page: number;
    pageSize: number;
    skip: number;
    take: number;
};
export type SortOrder = 'asc' | 'desc';
