"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readInlineRecordsFromPageContext = exports.resolvePageContextEntityId = exports.buildPageContextObservationName = void 0;
const INLINE_BODY_FIELD = 'content';
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function pickString(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function buildPageContextObservationName(kind) {
    const trimmed = kind.trim();
    return trimmed.length > 0 ? `page_context:${trimmed}` : 'page_context:unknown';
}
exports.buildPageContextObservationName = buildPageContextObservationName;
function pickFirstRouteParamId(routeParams) {
    if (!routeParams) {
        return null;
    }
    for (const value of Object.values(routeParams)) {
        const picked = pickString(value);
        if (picked) {
            return picked;
        }
    }
    return null;
}
function resolvePageContextEntityId(pageContext) {
    var _a, _b;
    if (!pageContext) {
        return null;
    }
    return ((_b = pickString((_a = pageContext.entity) === null || _a === void 0 ? void 0 : _a.id)) !== null && _b !== void 0 ? _b : pickFirstRouteParamId(pageContext.routeParams));
}
exports.resolvePageContextEntityId = resolvePageContextEntityId;
function readInlineRecordsFromPageContext(pageContext) {
    const metadata = pageContext.metadata;
    if (!isRecord(metadata)) {
        return [];
    }
    const fallbackEntityId = resolvePageContextEntityId(pageContext);
    const records = [];
    for (const [kind, value] of Object.entries(metadata)) {
        if (!isRecord(value)) {
            continue;
        }
        const content = pickString(value[INLINE_BODY_FIELD]);
        if (!content) {
            continue;
        }
        const entityId = fallbackEntityId !== null && fallbackEntityId !== void 0 ? fallbackEntityId : pickString(value.id);
        const record = Object.assign(Object.assign({}, value), { [INLINE_BODY_FIELD]: content });
        if (entityId) {
            record.id = entityId;
        }
        records.push({ kind, record });
    }
    return records;
}
exports.readInlineRecordsFromPageContext = readInlineRecordsFromPageContext;
//# sourceMappingURL=page-context-metadata-scan.util.js.map