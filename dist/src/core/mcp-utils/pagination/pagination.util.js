"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldFetchAnotherPage = exports.resolvePaginationCursor = exports.buildNextPageToolArgs = exports.observationNeedsPagedFetch = exports.extractListPaginationMeta = exports.resolveMaxListHttpPerTurn = exports.resolveGatherMaxPages = exports.resolveMaxListRows = exports.resolveMaxListPages = void 0;
const tool_pagination_params_util_1 = require("../../tool-engine/tool-pagination-params.util");
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
function normalizePayload(output) {
    if (typeof output !== 'string') {
        return output;
    }
    const trimmed = output.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        return output;
    }
    try {
        return JSON.parse(trimmed);
    }
    catch (_a) {
        return output;
    }
}
function findListRows(payload) {
    if (!isRecord(payload)) {
        return null;
    }
    for (const key of ['data', 'list', 'items', 'records']) {
        const rows = payload[key];
        if (Array.isArray(rows)) {
            const total = typeof payload.total === 'number'
                ? payload.total
                : typeof payload.count === 'number'
                    ? payload.count
                    : undefined;
            return { rows, total };
        }
    }
    return null;
}
function readPositiveInt(value, fallback) {
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
function resolvePageParamName(args) {
    for (const key of Object.keys(args)) {
        if ((0, tool_pagination_params_util_1.classifyPaginationParam)(key) === 'page') {
            return key;
        }
    }
    return 'page';
}
function resolveSizeParamName(args) {
    for (const key of Object.keys(args)) {
        if ((0, tool_pagination_params_util_1.classifyPaginationParam)(key) === 'size') {
            return key;
        }
    }
    return 'size';
}
function readPositiveIntEnv(name, fallback) {
    var _a;
    const raw = (_a = process.env[name]) === null || _a === void 0 ? void 0 : _a.trim();
    if (!raw) {
        return fallback;
    }
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 1 ? parsed : fallback;
}
function resolveMaxListPages() {
    return readPositiveIntEnv('TOOL_LIST_MAX_PAGES', 10);
}
exports.resolveMaxListPages = resolveMaxListPages;
function resolveMaxListRows() {
    return readPositiveIntEnv('TOOL_LIST_MAX_ROWS', 1000);
}
exports.resolveMaxListRows = resolveMaxListRows;
function resolveGatherMaxPages(pageSize) {
    const maxRows = resolveMaxListRows();
    const configured = resolveMaxListPages();
    const rowsNeededPages = Math.ceil(maxRows / Math.max(1, pageSize));
    return Math.max(configured, rowsNeededPages);
}
exports.resolveGatherMaxPages = resolveGatherMaxPages;
function resolveMaxListHttpPerTurn() {
    return readPositiveIntEnv('TOOL_LIST_MAX_HTTP_PER_TURN', 60);
}
exports.resolveMaxListHttpPerTurn = resolveMaxListHttpPerTurn;
function readTotalFromLlmPayload(llmPayload) {
    var _a;
    const total = (_a = llmPayload === null || llmPayload === void 0 ? void 0 : llmPayload.summary) === null || _a === void 0 ? void 0 : _a.total;
    return typeof total === 'number' && Number.isFinite(total) ? total : undefined;
}
function isMapReduceOutputComplete(output) {
    if (!isRecord(output)) {
        return false;
    }
    const mapReduce = output.__mapReduce;
    return (isRecord(mapReduce) &&
        mapReduce.complete === true &&
        mapReduce.mapComplete === true);
}
function extractListPaginationMeta(input) {
    var _a, _b;
    const payload = normalizePayload(input.output);
    const list = findListRows(payload);
    if (!list) {
        return null;
    }
    const args = (_a = input.args) !== null && _a !== void 0 ? _a : {};
    const pageParam = resolvePageParamName(args);
    const sizeParam = resolveSizeParamName(args);
    const page = readPositiveInt(args[pageParam], (0, tool_pagination_params_util_1.resolveDefaultListPage)());
    const pageSize = readPositiveInt(args[sizeParam], (0, tool_pagination_params_util_1.resolveDefaultListSize)());
    const rowCount = list.rows.length;
    const total = (_b = list.total) !== null && _b !== void 0 ? _b : readTotalFromLlmPayload(input.llmPayload);
    const fetchedSoFar = (page - 1) * pageSize + rowCount;
    const hasMore = total != null ? fetchedSoFar < total : rowCount >= pageSize;
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
exports.extractListPaginationMeta = extractListPaginationMeta;
function observationNeedsPagedFetch(input) {
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
exports.observationNeedsPagedFetch = observationNeedsPagedFetch;
function buildNextPageToolArgs(args, cursor) {
    return Object.assign(Object.assign({}, args), { [cursor.pageParam]: cursor.nextPage, [cursor.sizeParam]: cursor.pageSize });
}
exports.buildNextPageToolArgs = buildNextPageToolArgs;
function resolvePaginationCursor(args, meta) {
    return {
        pageParam: meta.pageParam,
        sizeParam: meta.sizeParam,
        nextPage: meta.page + 1,
        pageSize: meta.pageSize,
    };
}
exports.resolvePaginationCursor = resolvePaginationCursor;
function shouldFetchAnotherPage(meta) {
    return meta.hasMore && meta.rowCount > 0;
}
exports.shouldFetchAnotherPage = shouldFetchAnotherPage;
//# sourceMappingURL=pagination.util.js.map