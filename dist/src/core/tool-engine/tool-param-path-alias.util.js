"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeParamPathListAliases = exports.suggestArrayItemParamPathAlias = exports.resolveArrayItemParamPathAlias = exports.enumerateCompactParamPathAliasCandidates = void 0;
function splitPathSegments(path) {
    return path.split('.').filter((segment) => segment.length > 0);
}
function enumerateCompactParamPathAliasCandidates(path) {
    const segments = splitPathSegments(path);
    if (segments.length === 0) {
        return [path];
    }
    const candidates = [];
    const variantCount = 1 << segments.length;
    for (let mask = 0; mask < variantCount; mask += 1) {
        const parts = [];
        for (let i = 0; i < segments.length; i += 1) {
            const segment = segments[i];
            parts.push(mask & (1 << i) ? `${segment}[]` : segment);
        }
        candidates.push(parts.join('.'));
    }
    return candidates;
}
exports.enumerateCompactParamPathAliasCandidates = enumerateCompactParamPathAliasCandidates;
function countArrayMarkers(path) {
    var _a;
    return ((_a = path.match(/\[\]/g)) !== null && _a !== void 0 ? _a : []).length;
}
function resolveArrayItemParamPathAlias(path, paramPaths) {
    if (paramPaths.has(path)) {
        return path;
    }
    let best = null;
    let bestMarkerCount = Number.POSITIVE_INFINITY;
    for (const candidate of enumerateCompactParamPathAliasCandidates(path)) {
        if (candidate === path || !paramPaths.has(candidate)) {
            continue;
        }
        const markerCount = countArrayMarkers(candidate);
        if (markerCount < bestMarkerCount) {
            best = candidate;
            bestMarkerCount = markerCount;
        }
    }
    return best !== null && best !== void 0 ? best : path;
}
exports.resolveArrayItemParamPathAlias = resolveArrayItemParamPathAlias;
function suggestArrayItemParamPathAlias(path, paramPaths) {
    if (paramPaths.has(path)) {
        return null;
    }
    const resolved = resolveArrayItemParamPathAlias(path, paramPaths);
    return resolved !== path ? resolved : null;
}
exports.suggestArrayItemParamPathAlias = suggestArrayItemParamPathAlias;
function normalizeParamPathListAliases(paths, paramPaths) {
    return paths.map((path) => resolveArrayItemParamPathAlias(path, paramPaths));
}
exports.normalizeParamPathListAliases = normalizeParamPathListAliases;
//# sourceMappingURL=tool-param-path-alias.util.js.map