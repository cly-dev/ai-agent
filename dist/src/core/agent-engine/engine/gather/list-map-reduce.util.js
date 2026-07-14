"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectPageFindingsBrief = exports.collectNotableExamplesFromPageSummaries = exports.readMapReduceFromObservation = exports.mergeMapReduceObservationOutputs = exports.isMapReducePagedGatherResumable = exports.formatMapReduceFetchStatusNote = exports.resolveMapReduceGatherPhase = exports.buildMapReduceObservationOutput = exports.mergeMapReduceStates = exports.resolveMapReduceFetchComplete = exports.applyPageSummariesToState = exports.mergePageSummaryResults = exports.needsMapSummaryResume = exports.needsPaginationResume = exports.resolvePagesNeedingSummary = exports.pageSummarySucceeded = exports.hasReachedMaxListRows = exports.recordPageFetch = exports.findPageSourceCache = exports.recordPageSourceCache = exports.createEmptyMapReduceState = void 0;
const pagination_1 = require("../../../mcp-utils/pagination");
const message_blocks_util_1 = require("../message/message-blocks.util");
const list_map_reduce_types_1 = require("./list-map-reduce.types");
const list_page_summary_util_1 = require("./list-page-summary.util");
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
function createEmptyMapReduceState(pageSize) {
    return {
        fetchedCount: 0,
        pageCount: 0,
        fetchedApiPages: [],
        pageSize,
        maxRows: (0, pagination_1.resolveMaxListRows)(),
        pageSummaries: [],
        mapComplete: false,
        complete: false,
    };
}
exports.createEmptyMapReduceState = createEmptyMapReduceState;
function mergePageSourceCaches(left, right) {
    const byPage = new Map();
    for (const row of left !== null && left !== void 0 ? left : []) {
        byPage.set(row.page, row);
    }
    for (const row of right !== null && right !== void 0 ? right : []) {
        byPage.set(row.page, row);
    }
    if (byPage.size === 0) {
        return undefined;
    }
    return [...byPage.values()].sort((a, b) => a.page - b.page);
}
function recordPageSourceCache(input) {
    const prepared = (0, list_page_summary_util_1.prepareRowsForPageSummary)(input.rows);
    const entry = {
        page: input.page,
        rowCount: prepared.originalRowCount,
        rows: prepared.rows,
    };
    return Object.assign(Object.assign({}, input.state), { pageSourceByApiPage: mergePageSourceCaches(input.state.pageSourceByApiPage, [
            entry,
        ]) });
}
exports.recordPageSourceCache = recordPageSourceCache;
function findPageSourceCache(state, page) {
    var _a;
    return (_a = state.pageSourceByApiPage) === null || _a === void 0 ? void 0 : _a.find((row) => row.page === page);
}
exports.findPageSourceCache = findPageSourceCache;
function recordPageFetch(input) {
    var _a, _b;
    const rows = (0, message_blocks_util_1.extractListRowsFromToolOutput)(input.output);
    const fetchedApiPages = input.apiPage != null
        ? [...input.state.fetchedApiPages, input.apiPage]
        : [...input.state.fetchedApiPages];
    return Object.assign(Object.assign({}, input.state), { pageCount: input.state.pageCount + 1, fetchedCount: input.state.fetchedCount + rows.length, fetchedApiPages, total: (_a = input.total) !== null && _a !== void 0 ? _a : input.state.total, lastApiPage: (_b = input.apiPage) !== null && _b !== void 0 ? _b : input.state.lastApiPage, pageSize: input.pageSize != null && input.pageSize > 0
            ? input.pageSize
            : input.state.pageSize });
}
exports.recordPageFetch = recordPageFetch;
function hasReachedMaxListRows(state) {
    return state.fetchedCount >= state.maxRows;
}
exports.hasReachedMaxListRows = hasReachedMaxListRows;
function pageSummarySucceeded(page) {
    return page.error == null && page.summary != null;
}
exports.pageSummarySucceeded = pageSummarySucceeded;
function resolvePagesNeedingSummary(state) {
    const okPages = new Set(state.pageSummaries.filter(pageSummarySucceeded).map((row) => row.page));
    const candidates = state.fetchedApiPages.length > 0
        ? [...state.fetchedApiPages]
        : state.pageSummaries.map((row) => row.page);
    const unique = [...new Set(candidates)].sort((left, right) => left - right);
    return unique.filter((page) => !okPages.has(page));
}
exports.resolvePagesNeedingSummary = resolvePagesNeedingSummary;
function needsPaginationResume(state) {
    return !state.complete && state.fetchedCount > 0 && !state.resumeStalled;
}
exports.needsPaginationResume = needsPaginationResume;
function needsMapSummaryResume(state) {
    if (state.mapResumeStalled) {
        return false;
    }
    if (!state.complete) {
        return false;
    }
    return resolvePagesNeedingSummary(state).length > 0;
}
exports.needsMapSummaryResume = needsMapSummaryResume;
function mergePageSummaryResults(existing, updated) {
    const byPage = new Map();
    for (const row of existing) {
        byPage.set(row.page, row);
    }
    for (const row of updated) {
        byPage.set(row.page, row);
    }
    return [...byPage.values()].sort((left, right) => left.page - right.page);
}
exports.mergePageSummaryResults = mergePageSummaryResults;
function applyPageSummariesToState(state, pageSummaries) {
    const failed = pageSummaries.some((row) => row.error != null);
    const succeeded = pageSummaries.filter(pageSummarySucceeded).length;
    const expectedPages = state.fetchedApiPages.length > 0
        ? state.fetchedApiPages.length
        : state.pageCount;
    return Object.assign(Object.assign({}, state), { pageSummaries, mapComplete: succeeded >= expectedPages && expectedPages > 0, mapPartial: failed ? true : state.mapPartial });
}
exports.applyPageSummariesToState = applyPageSummariesToState;
function resolveMapReduceFetchComplete(input) {
    const truncated = input.hitMaxPages ||
        input.hitHttpBudget ||
        input.hitMaxRows ||
        (input.state.total != null &&
            input.state.fetchedCount < input.state.total);
    let complete = false;
    if (input.hitMaxRows) {
        complete = input.state.fetchedCount > 0;
    }
    else if (input.state.total != null) {
        complete = input.state.fetchedCount >= input.state.total;
    }
    else if (input.lastPageMeta != null) {
        complete = !(0, pagination_1.shouldFetchAnotherPage)(input.lastPageMeta);
    }
    else {
        complete = !truncated && input.state.fetchedCount > 0;
    }
    return { complete, truncated };
}
exports.resolveMapReduceFetchComplete = resolveMapReduceFetchComplete;
function mergeMapReduceStates(base, page) {
    var _a, _b, _c, _d, _e;
    const mergedPageSummaries = mergePageSummaryResults(base.pageSummaries, page.pageSummaries);
    return Object.assign(Object.assign({}, base), { fetchedCount: base.fetchedCount + page.fetchedCount, pageCount: base.pageCount + page.pageCount, fetchedApiPages: [...base.fetchedApiPages, ...page.fetchedApiPages], pageSummaries: mergedPageSummaries, total: (_a = page.total) !== null && _a !== void 0 ? _a : base.total, pageSize: page.pageSize > 0 ? page.pageSize : base.pageSize, lastApiPage: (_b = page.lastApiPage) !== null && _b !== void 0 ? _b : base.lastApiPage, mapComplete: base.mapComplete && page.mapComplete, mapPartial: base.mapPartial === true || page.mapPartial === true, complete: page.complete || base.complete, truncated: page.truncated === true || base.truncated === true, truncatedByMaxRows: page.truncatedByMaxRows === true || base.truncatedByMaxRows === true, lastPageFingerprint: (_c = page.lastPageFingerprint) !== null && _c !== void 0 ? _c : base.lastPageFingerprint, resumeStalled: (_d = page.resumeStalled) !== null && _d !== void 0 ? _d : base.resumeStalled, mapResumeStalled: (_e = page.mapResumeStalled) !== null && _e !== void 0 ? _e : base.mapResumeStalled, httpBudgetExhausted: page.httpBudgetExhausted === true || base.httpBudgetExhausted === true, pageSourceByApiPage: mergePageSourceCaches(base.pageSourceByApiPage, page.pageSourceByApiPage) });
}
exports.mergeMapReduceStates = mergeMapReduceStates;
function buildMapReduceObservationOutput(state) {
    var _a;
    const mapReduce = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ complete: state.complete, mapComplete: state.mapComplete, truncated: state.truncated === true, truncatedByMaxRows: state.truncatedByMaxRows === true, maxRows: state.maxRows, total: state.total, fetchedCount: state.fetchedCount, pageCount: state.pageCount, fetchedApiPages: state.fetchedApiPages }, (state.lastApiPage != null ? { lastApiPage: state.lastApiPage } : {})), { pageSize: state.pageSize, pageSummaries: state.pageSummaries }), (state.mapPartial === true ? { mapPartial: true } : {})), (state.lastPageFingerprint != null
        ? { lastPageFingerprint: state.lastPageFingerprint }
        : {})), (state.resumeStalled === true ? { resumeStalled: true } : {})), (state.mapResumeStalled === true ? { mapResumeStalled: true } : {})), (state.httpBudgetExhausted === true
        ? { httpBudgetExhausted: true }
        : {})), (state.mapComplete !== true && state.pageSourceByApiPage != null
        ? { pageSourceByApiPage: state.pageSourceByApiPage }
        : {}));
    const notableRows = collectNotableExamplesFromPageSummaries(state.pageSummaries, 12);
    return {
        [list_map_reduce_types_1.MAP_REDUCE_OUTPUT_KEY]: mapReduce,
        pageSummaries: state.pageSummaries,
        data: notableRows,
        total: (_a = state.total) !== null && _a !== void 0 ? _a : state.fetchedCount,
        matchedCount: state.fetchedCount,
    };
}
exports.buildMapReduceObservationOutput = buildMapReduceObservationOutput;
function isPartialMapReduceState(state) {
    if (state.fetchedCount <= 0) {
        return false;
    }
    if (state.mapResumeStalled === true ||
        state.resumeStalled === true ||
        state.httpBudgetExhausted === true) {
        return true;
    }
    if (!state.complete && state.truncated === true) {
        return state.pageCount >= (0, pagination_1.resolveGatherMaxPages)(state.pageSize);
    }
    return false;
}
function resolveMapReduceGatherPhase(output) {
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
exports.resolveMapReduceGatherPhase = resolveMapReduceGatherPhase;
function formatMapReduceFetchStatusNote(output) {
    const state = readMapReduceFromObservation(output);
    if (!state) {
        return null;
    }
    if (state.complete &&
        state.mapComplete &&
        state.truncated !== true &&
        state.resumeStalled !== true &&
        state.mapResumeStalled !== true) {
        return null;
    }
    const lines = [];
    if (state.truncatedByMaxRows === true) {
        lines.push(`List fetch capped at ${state.maxRows} records: collected ${state.fetchedCount}${state.total != null ? ` of ${state.total} total` : ''}. Analysis is based on this sample; tell the user when total exceeds the cap.`);
    }
    else if (state.truncated === true || state.resumeStalled === true) {
        lines.push(`List fetch incomplete: collected ${state.fetchedCount}${state.total != null ? `/${state.total}` : ''} records across ${state.pageCount} page(s). Analysis is based on partial data.`);
    }
    if (state.mapPartial === true) {
        lines.push('Some page summaries failed; analysis may be incomplete.');
    }
    else if (!state.mapComplete && state.complete) {
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
    }
    else if (state.truncated === true &&
        state.truncatedByMaxRows !== true &&
        state.resumeStalled !== true) {
        lines.push('Results may be truncated at the engine page cap.');
    }
    return lines.length > 0 ? lines.join(' ') : null;
}
exports.formatMapReduceFetchStatusNote = formatMapReduceFetchStatusNote;
function isMapReducePagedGatherResumable(output) {
    return resolveMapReduceGatherPhase(output) === 'resumable';
}
exports.isMapReducePagedGatherResumable = isMapReducePagedGatherResumable;
function mergeMapReduceObservationOutputs(outputs) {
    let merged = null;
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
exports.mergeMapReduceObservationOutputs = mergeMapReduceObservationOutputs;
function readPageSummaries(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    const out = [];
    for (const row of value) {
        if (!isRecord(row) || typeof row.page !== 'number') {
            continue;
        }
        out.push({
            page: row.page,
            rowCount: typeof row.rowCount === 'number' ? row.rowCount : 0,
            summary: isRecord(row.summary) ? row.summary : undefined,
            error: typeof row.error === 'string' ? row.error : undefined,
            errorDetail: typeof row.errorDetail === 'string' ? row.errorDetail : undefined,
        });
    }
    return out;
}
function readPageSourceCaches(value) {
    if (!Array.isArray(value)) {
        return undefined;
    }
    const out = [];
    for (const row of value) {
        if (!isRecord(row) || typeof row.page !== 'number' || !Array.isArray(row.rows)) {
            continue;
        }
        const rows = row.rows.filter((item) => isRecord(item));
        out.push({
            page: row.page,
            rowCount: typeof row.rowCount === 'number' ? row.rowCount : rows.length,
            rows,
        });
    }
    return out.length > 0 ? out : undefined;
}
function readFetchedApiPages(value, pageCount) {
    if (!Array.isArray(value)) {
        return [];
    }
    const pages = value.filter((row) => typeof row === 'number' && Number.isFinite(row));
    if (pages.length > 0) {
        return pages;
    }
    if (pageCount > 0) {
        return Array.from({ length: pageCount }, (_, index) => index + 1);
    }
    return [];
}
function readMapReduceFromObservation(output) {
    var _a;
    if (!isRecord(output)) {
        return null;
    }
    const mapReduce = output[list_map_reduce_types_1.MAP_REDUCE_OUTPUT_KEY];
    if (!isRecord(mapReduce)) {
        return null;
    }
    const pageCount = typeof mapReduce.pageCount === 'number' ? mapReduce.pageCount : 0;
    const pageSummaries = readPageSummaries((_a = mapReduce.pageSummaries) !== null && _a !== void 0 ? _a : output.pageSummaries);
    return {
        total: typeof mapReduce.total === 'number' ? mapReduce.total : undefined,
        fetchedCount: typeof mapReduce.fetchedCount === 'number' ? mapReduce.fetchedCount : 0,
        pageCount,
        fetchedApiPages: readFetchedApiPages(mapReduce.fetchedApiPages, pageCount),
        lastApiPage: typeof mapReduce.lastApiPage === 'number' ? mapReduce.lastApiPage : undefined,
        pageSize: typeof mapReduce.pageSize === 'number' ? mapReduce.pageSize : 0,
        maxRows: typeof mapReduce.maxRows === 'number'
            ? mapReduce.maxRows
            : (0, pagination_1.resolveMaxListRows)(),
        pageSummaries,
        pageSourceByApiPage: readPageSourceCaches(mapReduce.pageSourceByApiPage),
        mapComplete: mapReduce.mapComplete === true,
        mapPartial: mapReduce.mapPartial === true,
        complete: mapReduce.complete === true,
        truncated: mapReduce.truncated === true,
        truncatedByMaxRows: mapReduce.truncatedByMaxRows === true,
        lastPageFingerprint: typeof mapReduce.lastPageFingerprint === 'string'
            ? mapReduce.lastPageFingerprint
            : null,
        resumeStalled: mapReduce.resumeStalled === true,
        mapResumeStalled: mapReduce.mapResumeStalled === true,
        httpBudgetExhausted: mapReduce.httpBudgetExhausted === true,
    };
}
exports.readMapReduceFromObservation = readMapReduceFromObservation;
function collectNotableExamplesFromPageSummaries(pageSummaries, limit = 6) {
    var _a;
    const out = [];
    for (const page of pageSummaries) {
        const examples = (_a = page.summary) === null || _a === void 0 ? void 0 : _a.notableExamples;
        if (!Array.isArray(examples)) {
            continue;
        }
        for (const row of examples) {
            if (!isRecord(row)) {
                continue;
            }
            out.push(Object.assign(Object.assign({}, row), { page: page.page }));
            if (out.length >= limit) {
                return out;
            }
        }
    }
    return out;
}
exports.collectNotableExamplesFromPageSummaries = collectNotableExamplesFromPageSummaries;
function collectPageFindingsBrief(pageSummaries, limit = 15) {
    var _a;
    const out = [];
    for (const page of pageSummaries) {
        const findings = (_a = page.summary) === null || _a === void 0 ? void 0 : _a.keyFindings;
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
exports.collectPageFindingsBrief = collectPageFindingsBrief;
//# sourceMappingURL=list-map-reduce.util.js.map