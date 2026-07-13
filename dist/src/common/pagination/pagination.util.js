"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSortOrder = exports.toPaginatedResult = exports.resolvePagination = void 0;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
function resolvePagination(page, pageSize) {
    const resolvedPage = page != null && Number.isFinite(page) && page >= 1
        ? Math.floor(page)
        : DEFAULT_PAGE;
    const rawSize = pageSize != null && Number.isFinite(pageSize) && pageSize >= 1
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
exports.resolvePagination = resolvePagination;
function toPaginatedResult(items, total, page, pageSize) {
    return {
        items,
        total,
        page,
        pageSize,
        totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
    };
}
exports.toPaginatedResult = toPaginatedResult;
function resolveSortOrder(order) {
    return (order === null || order === void 0 ? void 0 : order.toLowerCase()) === 'asc' ? 'asc' : 'desc';
}
exports.resolveSortOrder = resolveSortOrder;
//# sourceMappingURL=pagination.util.js.map