"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isExcludedToolPath = exports.buildPathFilter = exports.matchesPathFilter = exports.normalizeToolPath = exports.DEFAULT_PATH_EXCLUDE_KEYWORDS = void 0;
exports.DEFAULT_PATH_EXCLUDE_KEYWORDS = ['public', 'buyer'];
function normalizeToolPath(path) {
    const trimmed = path.trim();
    if (!trimmed) {
        return '/';
    }
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}
exports.normalizeToolPath = normalizeToolPath;
function pathMatchesPattern(path, pattern) {
    const normalizedPath = normalizeToolPath(path).toLowerCase();
    const raw = pattern.trim();
    if (!raw) {
        return false;
    }
    return normalizedPath.includes(raw.toLowerCase());
}
function matchesPathFilter(path, filter) {
    if (filter.include.length > 0) {
        const included = filter.include.some((pattern) => pathMatchesPattern(path, pattern));
        if (!included) {
            return false;
        }
    }
    return !filter.exclude.some((pattern) => pathMatchesPattern(path, pattern));
}
exports.matchesPathFilter = matchesPathFilter;
function buildPathFilter(options) {
    const exclude = new Set([...options.exclude].map((item) => item.trim()).filter(Boolean));
    if (options.useDefaultExclude !== false) {
        for (const keyword of exports.DEFAULT_PATH_EXCLUDE_KEYWORDS) {
            exclude.add(keyword);
        }
    }
    return {
        include: [...options.include].map((item) => item.trim()).filter(Boolean),
        exclude: [...exclude],
    };
}
exports.buildPathFilter = buildPathFilter;
function isExcludedToolPath(path) {
    const filter = buildPathFilter({ include: [], exclude: [] });
    return !matchesPathFilter(path, filter);
}
exports.isExcludedToolPath = isExcludedToolPath;
//# sourceMappingURL=tool-path-filter.util.js.map