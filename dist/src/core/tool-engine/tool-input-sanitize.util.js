"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatQueryScalar = exports.sanitizeToolInvokeInput = exports.applyToolParameterDefaults = exports.collectOpenApiParameterSpecs = void 0;
const integration_site_util_1 = require("../../common/integration-site.util");
const tool_list_pagination_defaults_util_1 = require("./tool-list-pagination-defaults.util");
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;
function collectOpenApiParameterSpecs(schema) {
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
        return [];
    }
    const row = schema;
    const parameters = row.parameters;
    if (!Array.isArray(parameters)) {
        return [];
    }
    const out = [];
    for (const item of parameters) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            continue;
        }
        const p = item;
        const name = p.name;
        const inn = p.in;
        if (typeof name !== 'string' || typeof inn !== 'string') {
            continue;
        }
        const paramSchema = p.schema && typeof p.schema === 'object' && !Array.isArray(p.schema)
            ? p.schema
            : undefined;
        const items = p.items && typeof p.items === 'object' && !Array.isArray(p.items)
            ? p.items
            : (paramSchema === null || paramSchema === void 0 ? void 0 : paramSchema.items) &&
                typeof paramSchema.items === 'object' &&
                !Array.isArray(paramSchema.items)
                ? paramSchema.items
                : undefined;
        const itemsType = typeof (items === null || items === void 0 ? void 0 : items.type) === 'string' ? items.type : undefined;
        const resolvedType = typeof p.type === 'string'
            ? p.type
            : typeof (paramSchema === null || paramSchema === void 0 ? void 0 : paramSchema.type) === 'string'
                ? paramSchema.type
                : undefined;
        out.push({
            name,
            in: inn,
            type: resolvedType,
            itemsType,
            collectionFormat: typeof p.collectionFormat === 'string' ? p.collectionFormat : undefined,
            default: 'default' in p ? p.default : undefined,
        });
    }
    return out;
}
exports.collectOpenApiParameterSpecs = collectOpenApiParameterSpecs;
function applyToolParameterDefaults(input, specs, options) {
    const out = Object.assign({}, input);
    for (const spec of specs) {
        if (out[spec.name] !== undefined && out[spec.name] !== null) {
            continue;
        }
        if (spec.name === 'X-SHOP-ID') {
            out[spec.name] = (0, integration_site_util_1.getDefaultXShopId)();
            continue;
        }
        if (spec.default !== undefined) {
            out[spec.name] = spec.default;
        }
    }
    return (0, tool_list_pagination_defaults_util_1.applyListPaginationDefaults)(out, specs, options);
}
exports.applyToolParameterDefaults = applyToolParameterDefaults;
function sanitizeToolInvokeInput(input, specs) {
    const specByName = new Map(specs.map((spec) => [spec.name, spec]));
    const out = {};
    for (const [key, rawValue] of Object.entries(input)) {
        if (rawValue === undefined || rawValue === null) {
            continue;
        }
        const spec = specByName.get(key);
        const coerced = coerceBySpec(rawValue, spec, key);
        if (coerced === undefined) {
            continue;
        }
        out[key] = coerced;
    }
    return out;
}
exports.sanitizeToolInvokeInput = sanitizeToolInvokeInput;
function coerceBySpec(value, spec, fieldName) {
    var _a;
    const type = (_a = spec === null || spec === void 0 ? void 0 : spec.type) !== null && _a !== void 0 ? _a : inferValueType(value);
    const itemsType = spec === null || spec === void 0 ? void 0 : spec.itemsType;
    const inHeader = (spec === null || spec === void 0 ? void 0 : spec.in) === 'header';
    if (type === 'array') {
        const arr = coerceToArray(value, itemsType);
        if (!arr || arr.length === 0) {
            return undefined;
        }
        return arr;
    }
    if (type === 'integer' || type === 'number') {
        return coerceNumber(value, fieldName, type === 'integer');
    }
    if (type === 'boolean') {
        return coerceBoolean(value);
    }
    if (type === 'object') {
        return coerceObject(value, inHeader);
    }
    return coerceString(value, inHeader ? 'header' : 'default');
}
function inferValueType(value) {
    if (Array.isArray(value)) {
        return 'array';
    }
    if (typeof value === 'boolean') {
        return 'boolean';
    }
    if (typeof value === 'number') {
        return Number.isInteger(value) ? 'integer' : 'number';
    }
    if (typeof value === 'object' && value !== null) {
        return 'object';
    }
    return 'string';
}
function coerceToArray(value, itemType) {
    if (Array.isArray(value)) {
        return value
            .map((item) => coerceArrayItem(item, itemType))
            .filter((item) => item !== undefined && item !== null && item !== '');
    }
    if (typeof value === 'string') {
        const trimmed = sanitizeString(value, 'default');
        if (!trimmed) {
            return undefined;
        }
        if (trimmed.startsWith('[')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    return coerceToArray(parsed, itemType);
                }
            }
            catch (_a) {
            }
        }
        if (trimmed.includes(',')) {
            return trimmed
                .split(',')
                .map((part) => coerceArrayItem(part.trim(), itemType))
                .filter((item) => item !== undefined && item !== null && item !== '');
        }
        const single = coerceArrayItem(trimmed, itemType);
        return single === undefined ? undefined : [single];
    }
    const single = coerceArrayItem(value, itemType);
    return single === undefined ? undefined : [single];
}
function coerceArrayItem(value, itemType) {
    if (value === null || value === undefined) {
        return undefined;
    }
    const type = itemType !== null && itemType !== void 0 ? itemType : inferValueType(value);
    if (type === 'integer' || type === 'number') {
        return coerceNumber(value, 'item', type === 'integer');
    }
    if (type === 'boolean') {
        return coerceBoolean(value);
    }
    if (type === 'object') {
        if (typeof value === 'string') {
            const trimmed = sanitizeString(value, 'default');
            if (!trimmed.startsWith('{')) {
                return undefined;
            }
            try {
                const parsed = JSON.parse(trimmed);
                return coerceObject(parsed, false);
            }
            catch (_a) {
                return undefined;
            }
        }
        return coerceObject(value, false);
    }
    return coerceString(value, 'default');
}
function coerceNumber(value, _fieldName, integer) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return integer ? Math.trunc(value) : value;
    }
    if (typeof value === 'string') {
        const trimmed = sanitizeString(value, 'default');
        if (!trimmed) {
            return undefined;
        }
        if (/^-?\d+$/.test(trimmed) && trimmed.length > 15) {
            return trimmed;
        }
        const parsed = integer ? Number.parseInt(trimmed, 10) : Number(trimmed);
        if (Number.isFinite(parsed)) {
            return integer ? Math.trunc(parsed) : parsed;
        }
        return undefined;
    }
    return undefined;
}
function coerceBoolean(value) {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        const t = sanitizeString(value, 'default').toLowerCase();
        if (t === 'true' || t === '1' || t === 'yes') {
            return true;
        }
        if (t === 'false' || t === '0' || t === 'no') {
            return false;
        }
    }
    if (typeof value === 'number') {
        return value !== 0;
    }
    return undefined;
}
function coerceObject(value, inHeader) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return undefined;
    }
    const row = value;
    const out = {};
    for (const [key, item] of Object.entries(row)) {
        const coerced = coerceBySpec(item, undefined, key);
        if (coerced !== undefined) {
            out[key] = coerced;
        }
    }
    return Object.keys(out).length > 0 ? out : undefined;
}
function coerceString(value, mode) {
    if (typeof value === 'string') {
        const s = sanitizeString(value, mode);
        return s.length > 0 ? s : undefined;
    }
    if (typeof value === 'number' ||
        typeof value === 'boolean' ||
        typeof value === 'bigint') {
        return String(value);
    }
    if (value === null || value === undefined) {
        return undefined;
    }
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        }
        catch (_a) {
            return undefined;
        }
    }
    return sanitizeString(String(value), mode) || undefined;
}
function sanitizeString(value, mode) {
    let s = value
        .normalize('NFKC')
        .replace(CONTROL_CHARS, '')
        .replace(ZERO_WIDTH, '')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .trim();
    if (mode === 'header') {
        s = s.replace(/[\r\n]+/g, ' ').trim();
    }
    return s;
}
function formatQueryScalar(value) {
    if (value === null || value === undefined) {
        return '';
    }
    if (typeof value === 'string') {
        return sanitizeString(value, 'default');
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    if (typeof value === 'bigint') {
        return value.toString();
    }
    try {
        return JSON.stringify(value);
    }
    catch (_a) {
        return sanitizeString(String(value), 'default');
    }
}
exports.formatQueryScalar = formatQueryScalar;
//# sourceMappingURL=tool-input-sanitize.util.js.map