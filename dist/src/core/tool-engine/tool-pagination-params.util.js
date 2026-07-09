"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveEffectiveArrayLimit = exports.resolveDefaultListArrayLimit = exports.resolveDefaultListSize = exports.resolveDefaultListPage = exports.isPaginationParam = exports.classifyPaginationParam = exports.SIZE_PARAM_RE = exports.PAGE_PARAM_RE = exports.LEGACY_DEFAULT_ARRAY_LIMIT = void 0;
exports.LEGACY_DEFAULT_ARRAY_LIMIT = 5;
exports.PAGE_PARAM_RE = /^page(?:number|num|no|index)?$/i;
exports.SIZE_PARAM_RE = /^(?:page)?size$|^limit$|^pagesize$|^per_?page$|^page_size$|^maxresults$/i;
function classifyPaginationParam(name) {
    if (exports.PAGE_PARAM_RE.test(name)) {
        return 'page';
    }
    if (exports.SIZE_PARAM_RE.test(name)) {
        return 'size';
    }
    return null;
}
exports.classifyPaginationParam = classifyPaginationParam;
function isPaginationParam(name) {
    return classifyPaginationParam(name) != null;
}
exports.isPaginationParam = isPaginationParam;
function readPositiveIntEnv(name, fallback) {
    var _a;
    const raw = (_a = process.env[name]) === null || _a === void 0 ? void 0 : _a.trim();
    if (!raw) {
        return fallback;
    }
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 1 ? parsed : fallback;
}
function resolveDefaultListPage() {
    return readPositiveIntEnv('TOOL_LIST_DEFAULT_PAGE', 1);
}
exports.resolveDefaultListPage = resolveDefaultListPage;
function resolveDefaultListSize() {
    return readPositiveIntEnv('TOOL_LIST_DEFAULT_SIZE', 100);
}
exports.resolveDefaultListSize = resolveDefaultListSize;
function resolveDefaultListArrayLimit() {
    return readPositiveIntEnv('TOOL_LIST_ARRAY_LIMIT', resolveDefaultListSize());
}
exports.resolveDefaultListArrayLimit = resolveDefaultListArrayLimit;
function resolveEffectiveArrayLimit(explicit) {
    const envDefault = resolveDefaultListArrayLimit();
    if (explicit == null) {
        return envDefault;
    }
    if (explicit <= exports.LEGACY_DEFAULT_ARRAY_LIMIT) {
        return envDefault;
    }
    return explicit;
}
exports.resolveEffectiveArrayLimit = resolveEffectiveArrayLimit;
//# sourceMappingURL=tool-pagination-params.util.js.map