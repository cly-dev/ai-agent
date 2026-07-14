"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeHostToolArgsAgainstContextCatalogs = exports.enrichHostToolArgsSchemaWithContextCatalogs = exports.collectContextIdCatalog = exports.resolveHostToolArgsSchemaForToolCallBind = exports.isHostToolCatalogEnumInjectEnabled = void 0;
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
const CONTEXT_ID_CATALOG_KEY = 'x-contextIdCatalog';
function isHostToolCatalogEnumInjectEnabled() {
    var _a;
    const raw = (_a = process.env.HOST_TOOL_CATALOG_ENUM_INJECT) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
    if (!raw) {
        return false;
    }
    if (raw === '0' || raw === 'false' || raw === 'off' || raw === 'no') {
        return false;
    }
    return true;
}
exports.isHostToolCatalogEnumInjectEnabled = isHostToolCatalogEnumInjectEnabled;
function resolveHostToolArgsSchemaForToolCallBind(argsSchema, context) {
    if (!isHostToolCatalogEnumInjectEnabled()) {
        return { schema: argsSchema, catalogEnumInjected: false };
    }
    const enriched = enrichHostToolArgsSchemaWithContextCatalogs(argsSchema, context);
    return {
        schema: enriched,
        catalogEnumInjected: enriched !== argsSchema,
    };
}
exports.resolveHostToolArgsSchemaForToolCallBind = resolveHostToolArgsSchemaForToolCallBind;
function collectContextIdCatalog(context, catalogPath) {
    const out = new Set();
    if (!context || !catalogPath.trim()) {
        return out;
    }
    const parts = catalogPath.split('.').map((part) => part.trim()).filter(Boolean);
    let cursor = context;
    for (const part of parts) {
        if (!isRecord(cursor)) {
            return out;
        }
        cursor = cursor[part];
    }
    if (!Array.isArray(cursor)) {
        return out;
    }
    for (const item of cursor) {
        if (!isRecord(item)) {
            continue;
        }
        const id = item.id;
        if (typeof id === 'string' && id.trim()) {
            out.add(id.trim());
        }
        else if (typeof id === 'number' && Number.isFinite(id)) {
            out.add(String(id));
        }
    }
    return out;
}
exports.collectContextIdCatalog = collectContextIdCatalog;
function readPropertyCatalogPath(def) {
    if (!isRecord(def)) {
        return null;
    }
    const raw = def[CONTEXT_ID_CATALOG_KEY];
    if (typeof raw === 'string' && raw.trim()) {
        return raw.trim();
    }
    if (isRecord(def.items)) {
        const nested = def.items[CONTEXT_ID_CATALOG_KEY];
        if (typeof nested === 'string' && nested.trim()) {
            return nested.trim();
        }
    }
    return null;
}
function enrichHostToolArgsSchemaWithContextCatalogs(argsSchema, context) {
    if (!context || !isRecord(argsSchema.properties)) {
        return argsSchema;
    }
    const properties = argsSchema.properties;
    let changed = false;
    const nextProperties = Object.assign({}, properties);
    for (const [key, def] of Object.entries(properties)) {
        const catalogPath = readPropertyCatalogPath(def);
        if (!catalogPath || !isRecord(def)) {
            continue;
        }
        const allowed = [...collectContextIdCatalog(context, catalogPath)];
        if (allowed.length === 0) {
            continue;
        }
        const items = isRecord(def.items) ? Object.assign({}, def.items) : { type: 'string' };
        nextProperties[key] = Object.assign(Object.assign({}, def), { items: Object.assign(Object.assign({}, items), { type: 'string', enum: allowed }) });
        changed = true;
    }
    if (!changed) {
        return argsSchema;
    }
    return Object.assign(Object.assign({}, argsSchema), { properties: nextProperties });
}
exports.enrichHostToolArgsSchemaWithContextCatalogs = enrichHostToolArgsSchemaWithContextCatalogs;
function sanitizeHostToolArgsAgainstContextCatalogs(args, argsSchema, context) {
    if (!context || !isRecord(argsSchema.properties)) {
        return { args, droppedByField: {} };
    }
    const properties = argsSchema.properties;
    const next = Object.assign({}, args);
    const droppedByField = {};
    for (const [key, def] of Object.entries(properties)) {
        const catalogPath = readPropertyCatalogPath(def);
        if (!catalogPath) {
            continue;
        }
        const value = next[key];
        if (!Array.isArray(value)) {
            continue;
        }
        const allowed = collectContextIdCatalog(context, catalogPath);
        if (allowed.size === 0) {
            continue;
        }
        const kept = [];
        const dropped = [];
        for (const item of value) {
            const id = typeof item === 'string'
                ? item.trim()
                : typeof item === 'number' && Number.isFinite(item)
                    ? String(item)
                    : '';
            if (!id) {
                continue;
            }
            if (allowed.has(id)) {
                kept.push(id);
            }
            else {
                dropped.push(id);
            }
        }
        next[key] = kept;
        if (dropped.length > 0) {
            droppedByField[key] = dropped;
        }
    }
    return { args: next, droppedByField };
}
exports.sanitizeHostToolArgsAgainstContextCatalogs = sanitizeHostToolArgsAgainstContextCatalogs;
//# sourceMappingURL=host-tool-args-context-catalog.util.js.map