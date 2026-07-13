"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePageContextFromMessageFields = void 0;
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function pickString(value) {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
function pickNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    return undefined;
}
function normalizeRouteParams(value) {
    if (!isRecord(value)) {
        return undefined;
    }
    const out = {};
    for (const [key, nested] of Object.entries(value)) {
        const trimmedKey = key.trim();
        if (!trimmedKey) {
            continue;
        }
        if (nested === null ||
            typeof nested === 'string' ||
            typeof nested === 'number' ||
            typeof nested === 'boolean') {
            if (typeof nested === 'string') {
                const trimmed = nested.trim();
                if (trimmed) {
                    out[trimmedKey] = trimmed;
                }
                continue;
            }
            if (nested !== null) {
                out[trimmedKey] = nested;
            }
            continue;
        }
    }
    return Object.keys(out).length > 0 ? out : undefined;
}
function normalizeEntity(value) {
    if (!isRecord(value)) {
        return undefined;
    }
    const entity = Object.assign({}, value);
    const type = pickString(entity.type);
    const id = pickString(entity.id);
    if (type) {
        entity.type = type;
    }
    else {
        delete entity.type;
    }
    if (id) {
        entity.id = id;
    }
    else {
        delete entity.id;
    }
    return Object.keys(entity).length > 0 ? entity : undefined;
}
function normalizePageContextObject(value) {
    if (!isRecord(value)) {
        return null;
    }
    const page = pickString(value.page);
    const routePath = pickString(value.routePath);
    const routeParams = normalizeRouteParams(value.routeParams);
    const flowId = pickNumber(value.flowId);
    const programName = pickString(value.programName);
    const entity = normalizeEntity(value.entity);
    const metadata = isRecord(value.metadata) ? value.metadata : undefined;
    if (!page &&
        !routePath &&
        !routeParams &&
        flowId == null &&
        !programName &&
        !entity &&
        !metadata) {
        return null;
    }
    return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (page ? { page } : {})), (routePath ? { routePath } : {})), (routeParams ? { routeParams } : {})), (flowId != null ? { flowId } : {})), (programName ? { programName } : {})), (entity ? { entity } : {})), (metadata ? { metadata } : {}));
}
function mergePageContexts(primary, fallback) {
    var _a, _b, _c, _d, _e, _f;
    if (!primary && !fallback) {
        return null;
    }
    const merged = Object.assign(Object.assign({}, (fallback !== null && fallback !== void 0 ? fallback : {})), (primary !== null && primary !== void 0 ? primary : {}));
    if ((primary === null || primary === void 0 ? void 0 : primary.entity) || (fallback === null || fallback === void 0 ? void 0 : fallback.entity)) {
        merged.entity = Object.assign(Object.assign({}, ((_a = fallback === null || fallback === void 0 ? void 0 : fallback.entity) !== null && _a !== void 0 ? _a : {})), ((_b = primary === null || primary === void 0 ? void 0 : primary.entity) !== null && _b !== void 0 ? _b : {}));
    }
    if ((primary === null || primary === void 0 ? void 0 : primary.metadata) || (fallback === null || fallback === void 0 ? void 0 : fallback.metadata)) {
        merged.metadata = Object.assign(Object.assign({}, ((_c = fallback === null || fallback === void 0 ? void 0 : fallback.metadata) !== null && _c !== void 0 ? _c : {})), ((_d = primary === null || primary === void 0 ? void 0 : primary.metadata) !== null && _d !== void 0 ? _d : {}));
    }
    if ((primary === null || primary === void 0 ? void 0 : primary.routeParams) || (fallback === null || fallback === void 0 ? void 0 : fallback.routeParams)) {
        merged.routeParams = Object.assign(Object.assign({}, ((_e = fallback === null || fallback === void 0 ? void 0 : fallback.routeParams) !== null && _e !== void 0 ? _e : {})), ((_f = primary === null || primary === void 0 ? void 0 : primary.routeParams) !== null && _f !== void 0 ? _f : {}));
    }
    if (!merged.page &&
        !merged.routePath &&
        !merged.routeParams &&
        merged.flowId == null &&
        !merged.programName &&
        !merged.entity &&
        !merged.metadata) {
        return null;
    }
    return merged;
}
function parsePageContextFromMessageFields(input) {
    const nested = normalizePageContextObject(input.pageContext);
    const flat = normalizePageContextObject({
        page: input.page,
        routePath: input.routePath,
        routeParams: input.routeParams,
        flowId: input.flowId,
        programName: input.programName,
        entity: input.entity,
        metadata: input.metadata,
    });
    return mergePageContexts(nested, flat);
}
exports.parsePageContextFromMessageFields = parsePageContextFromMessageFields;
//# sourceMappingURL=parse-page-context.util.js.map