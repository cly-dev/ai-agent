"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listRequiredParamNames = exports.buildCompactToolInput = exports.applyParamFormatHintsToCompactInput = exports.normalizeAgentMetadataForPersist = exports.syncAgentMetadataParamFormatHints = exports.resolveParamFormatHints = exports.listToolInputCompactParams = exports.compactParamToFormatHint = exports.describeJsonSchemaType = void 0;
const tool_agent_metadata_util_1 = require("./tool-agent-metadata.util");
function normalizeDescription(value) {
    if (!value) {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function readFormat(param) {
    const direct = typeof param.format === 'string' && param.format.trim().length > 0
        ? param.format.trim()
        : undefined;
    if (direct) {
        return direct;
    }
    const schema = param.schema;
    if (isRecord(schema) && typeof schema.format === 'string' && schema.format.trim()) {
        return schema.format.trim();
    }
    return undefined;
}
function describeJsonSchemaType(schema, visited = new WeakSet()) {
    if (visited.has(schema)) {
        return '…';
    }
    visited.add(schema);
    const ref = readSchemaRef(schema);
    if (ref) {
        return ref;
    }
    const enumValues = readEnum(schema);
    if (enumValues && enumValues.length > 0) {
        return `enum(${enumValues.join('|')})`;
    }
    const typeRaw = typeof schema.type === 'string' ? schema.type : undefined;
    const format = typeof schema.format === 'string' && schema.format.trim().length > 0
        ? schema.format.trim()
        : undefined;
    if (typeRaw === 'array') {
        const items = isRecord(schema.items) ? schema.items : null;
        const itemDesc = items ? describeJsonSchemaType(items, visited) : 'unknown';
        return `array<${itemDesc}>`;
    }
    const properties = isRecord(schema.properties) ? schema.properties : null;
    if (typeRaw === 'object' || (!typeRaw && properties)) {
        if (!properties || Object.keys(properties).length === 0) {
            return 'object';
        }
        const requiredSet = new Set(Array.isArray(schema.required)
            ? schema.required.filter((field) => typeof field === 'string')
            : []);
        const fields = Object.entries(properties).map(([key, raw]) => {
            if (!isRecord(raw)) {
                return `${key}:unknown`;
            }
            const opt = requiredSet.has(key) ? '' : '?';
            const inner = describeJsonSchemaType(raw, visited);
            const propDesc = typeof raw.description === 'string' ? raw.description.trim() : '';
            return propDesc
                ? `${key}${opt}:${inner}(${propDesc})`
                : `${key}${opt}:${inner}`;
        });
        return `object{${fields.join(', ')}}`;
    }
    if (typeRaw) {
        if (format && format !== typeRaw && format !== 'false' && format !== 'true') {
            return `${typeRaw}(${format})`;
        }
        return typeRaw;
    }
    return 'unknown';
}
exports.describeJsonSchemaType = describeJsonSchemaType;
function readParamType(param) {
    const schema = param.schema;
    if (isRecord(schema)) {
        return describeJsonSchemaType(schema);
    }
    const type = param.type;
    if (typeof type === 'string') {
        if (type === 'array' && isRecord(param.items)) {
            return describeJsonSchemaType({ type: 'array', items: param.items });
        }
        if (type === 'object' && isRecord(param.properties)) {
            return describeJsonSchemaType(param);
        }
        const format = readFormat(param);
        if (format && format !== type && format !== 'false' && format !== 'true') {
            return `${type}(${format})`;
        }
        return type;
    }
    return undefined;
}
function schemaHasNestedStructure(schema) {
    const type = typeof schema.type === 'string' ? schema.type : undefined;
    if (type === 'object' && isRecord(schema.properties)) {
        return Object.keys(schema.properties).length > 0;
    }
    if (type === 'array' && isRecord(schema.items)) {
        return schemaHasNestedStructure(schema.items);
    }
    return false;
}
function compactRowFromSchemaNode(name, schemaNode, required, location) {
    var _a;
    return {
        name,
        required,
        in: location !== null && location !== void 0 ? location : 'body',
        type: (_a = readParamType({ schema: schemaNode })) !== null && _a !== void 0 ? _a : 'unknown',
        format: readFormat(schemaNode),
        description: normalizeDescription(typeof schemaNode.description === 'string' ? schemaNode.description : undefined),
        enum: readEnum(schemaNode),
        schemaRef: readSchemaRef(schemaNode),
    };
}
function collectNestedHintParams(schemaNode, basePath, location, collector) {
    const typeRaw = typeof schemaNode.type === 'string' ? schemaNode.type : undefined;
    if (typeRaw === 'array' && isRecord(schemaNode.items)) {
        collectNestedHintParams(schemaNode.items, `${basePath}[]`, location, collector);
        return;
    }
    const properties = isRecord(schemaNode.properties) ? schemaNode.properties : null;
    if (typeRaw === 'object' || (!typeRaw && properties)) {
        if (!properties) {
            return;
        }
        const requiredSet = new Set(Array.isArray(schemaNode.required)
            ? schemaNode.required.filter((field) => typeof field === 'string')
            : []);
        for (const [key, raw] of Object.entries(properties)) {
            if (!isRecord(raw)) {
                continue;
            }
            const childPath = basePath ? `${basePath}.${key}` : key;
            collector.push(compactRowFromSchemaNode(childPath, raw, requiredSet.has(key), location));
            if (schemaHasNestedStructure(raw)) {
                collectNestedHintParams(raw, childPath, location, collector);
            }
        }
    }
}
function readSchemaRef(schema) {
    if (typeof schema.$ref === 'string' && schema.$ref.trim().length > 0) {
        return schema.$ref.trim();
    }
    if (typeof schema.originalRef === 'string' &&
        schema.originalRef.trim().length > 0) {
        return schema.originalRef.trim();
    }
    return undefined;
}
function readEnum(source) {
    const values = source.enum;
    if (!Array.isArray(values) || values.length === 0) {
        return undefined;
    }
    return values.map((item) => String(item));
}
function flattenInlineSchemaProperties(schema, requiredSet) {
    const properties = isRecord(schema.properties) ? schema.properties : null;
    if (!properties) {
        return [];
    }
    const bodyRequired = new Set(Array.isArray(schema.required)
        ? schema.required.filter((field) => typeof field === 'string')
        : []);
    const rows = [];
    for (const [name, raw] of Object.entries(properties)) {
        if (!isRecord(raw)) {
            continue;
        }
        rows.push(compactRowFromSchemaNode(name, raw, bodyRequired.has(name) || requiredSet.has(name), 'body'));
    }
    return rows;
}
function compactOpenApiParameter(item) {
    const name = typeof item.name === 'string' && item.name.trim().length > 0
        ? item.name.trim()
        : null;
    if (!name) {
        return null;
    }
    const location = typeof item.in === 'string' ? item.in : undefined;
    const schema = isRecord(item.schema) ? item.schema : null;
    if (location === 'body' || schema) {
        const bodySchema = schema !== null && schema !== void 0 ? schema : item;
        const schemaRef = isRecord(bodySchema) ? readSchemaRef(bodySchema) : undefined;
        return {
            name,
            required: item.required === true,
            in: location !== null && location !== void 0 ? location : 'body',
            type: bodySchema && isRecord(bodySchema)
                ? readParamType({ schema: bodySchema })
                : readParamType(item),
            format: readFormat(item),
            description: normalizeDescription(typeof item.description === 'string' ? item.description : undefined),
            enum: schema ? readEnum(schema) : readEnum(item),
            schemaRef,
        };
    }
    return {
        name,
        required: item.required === true,
        in: location,
        type: readParamType(item),
        format: readFormat(item),
        description: normalizeDescription(typeof item.description === 'string' ? item.description : undefined),
        enum: readEnum(item),
    };
}
function extractParametersFromOpenApiDocument(source) {
    if (!isRecord(source)) {
        return [];
    }
    const parameters = source.parameters;
    if (!Array.isArray(parameters)) {
        return [];
    }
    const rows = [];
    for (const item of parameters) {
        if (!isRecord(item)) {
            continue;
        }
        const row = compactOpenApiParameter(item);
        if (row) {
            rows.push(row);
        }
    }
    return rows;
}
function extractRequestBodyFromOpenApiDocument(source) {
    if (!isRecord(source)) {
        return undefined;
    }
    const requestBody = source.requestBody;
    if (requestBody == null) {
        return null;
    }
    if (!isRecord(requestBody)) {
        return null;
    }
    const description = normalizeDescription(typeof requestBody.description === 'string'
        ? requestBody.description
        : undefined);
    const required = typeof requestBody.required === 'boolean' ? requestBody.required : undefined;
    const content = requestBody.content;
    if (!isRecord(content)) {
        return { required, description };
    }
    const appJson = content['application/json'];
    if (!isRecord(appJson)) {
        return { required, description };
    }
    const schema = appJson.schema;
    if (!isRecord(schema)) {
        return { required, description };
    }
    const schemaRef = readSchemaRef(schema);
    const requiredSet = new Set(Array.isArray(schema.required)
        ? schema.required.filter((field) => typeof field === 'string')
        : []);
    const properties = flattenInlineSchemaProperties(schema, requiredSet);
    return Object.assign({ required,
        description,
        schemaRef }, (properties.length > 0 ? { properties } : {}));
}
function resolveOpenApiInputDocument(inputSchema, fallbackSchema) {
    if (isRecord(inputSchema) && Array.isArray(inputSchema.parameters)) {
        return inputSchema;
    }
    if (isRecord(fallbackSchema) && Array.isArray(fallbackSchema.parameters)) {
        return fallbackSchema;
    }
    return null;
}
function scoreOptionalParam(param, businessFields) {
    var _a;
    let score = 0;
    const nameLower = param.name.toLowerCase();
    const descLower = ((_a = param.description) !== null && _a !== void 0 ? _a : '').toLowerCase();
    for (const field of businessFields) {
        const normalized = field.toLowerCase();
        if (nameLower.includes(normalized) ||
            normalized.includes(nameLower) ||
            descLower.includes(normalized)) {
            score += 100;
        }
    }
    return score;
}
function prioritizeOptionalParams(optional, businessFields) {
    return [...optional].sort((a, b) => {
        const diff = scoreOptionalParam(b, businessFields) - scoreOptionalParam(a, businessFields);
        if (diff !== 0) {
            return diff;
        }
        return a.name.localeCompare(b.name);
    });
}
function formatParamFormatHintSuffix(hint) {
    return hint.example
        ? `[format] ${hint.hint} (e.g. ${hint.example})`
        : `[format] ${hint.hint}`;
}
function formatLocationHint(location) {
    if (!location) {
        return undefined;
    }
    return `in=${location}`;
}
function defaultExampleForType(type) {
    if (!type) {
        return undefined;
    }
    if (type.startsWith('array<')) {
        return '[]';
    }
    if (type.startsWith('object{') || type === 'object') {
        return '{}';
    }
    if (type === 'integer' || type.startsWith('integer(') || type === 'number') {
        return '1';
    }
    if (type === 'boolean') {
        return 'false';
    }
    return undefined;
}
function compactParamToFormatHint(row) {
    var _a, _b, _c, _d, _e, _f;
    const segments = [];
    const locationHint = formatLocationHint(row.in);
    if (locationHint) {
        segments.push(locationHint);
    }
    if (row.required) {
        segments.push('required');
    }
    if ((_a = row.type) === null || _a === void 0 ? void 0 : _a.trim()) {
        segments.push(`type=${row.type.trim()}`);
    }
    else if ((_b = row.format) === null || _b === void 0 ? void 0 : _b.trim()) {
        segments.push(`format=${row.format.trim()}`);
    }
    if ((_c = row.description) === null || _c === void 0 ? void 0 : _c.trim()) {
        segments.push(row.description.trim());
    }
    if (row.enum && row.enum.length > 0) {
        segments.push(`enum: ${row.enum.join(', ')}`);
    }
    if (segments.length === 0) {
        return null;
    }
    const example = (_f = (_e = (_d = row.enum) === null || _d === void 0 ? void 0 : _d[0]) !== null && _e !== void 0 ? _e : defaultExampleForType(row.type)) !== null && _f !== void 0 ? _f : (row.in === 'header' ? row.name : undefined);
    return example
        ? { param: row.name, hint: segments.join('; '), example }
        : { param: row.name, hint: segments.join('; ') };
}
exports.compactParamToFormatHint = compactParamToFormatHint;
function appendNestedHintParams(collector, seen, basePath, schema, location) {
    if (!schemaHasNestedStructure(schema)) {
        return;
    }
    const nested = [];
    collectNestedHintParams(schema, basePath, location, nested);
    for (const row of nested) {
        if (seen.has(row.name)) {
            continue;
        }
        seen.add(row.name);
        collector.push(row);
    }
}
function listAllCompactParamsFromInputDocument(inputSchema, fallbackSchema) {
    var _a, _b;
    const document = resolveOpenApiInputDocument(inputSchema, fallbackSchema);
    if (!document) {
        return [];
    }
    const seen = new Set();
    const merged = [];
    const parameters = document.parameters;
    if (Array.isArray(parameters)) {
        for (const item of parameters) {
            if (!isRecord(item)) {
                continue;
            }
            const row = compactOpenApiParameter(item);
            if (!row) {
                continue;
            }
            if (seen.has(row.name)) {
                continue;
            }
            seen.add(row.name);
            merged.push(row);
            const schema = isRecord(item.schema) ? item.schema : null;
            if (schema) {
                appendNestedHintParams(merged, seen, row.name, schema, row.in);
            }
        }
    }
    const bodyProps = (_b = (_a = extractRequestBodyFromOpenApiDocument(document)) === null || _a === void 0 ? void 0 : _a.properties) !== null && _b !== void 0 ? _b : [];
    for (const row of bodyProps) {
        if (seen.has(row.name)) {
            continue;
        }
        seen.add(row.name);
        merged.push(row);
    }
    return merged;
}
function listToolInputCompactParams(inputSchema, fallbackSchema) {
    return listAllCompactParamsFromInputDocument(inputSchema, fallbackSchema);
}
exports.listToolInputCompactParams = listToolInputCompactParams;
function resolveParamFormatHints(inputSchema, fallbackSchema, explicitHints) {
    const resolved = [];
    const seen = new Set();
    for (const row of listAllCompactParamsFromInputDocument(inputSchema, fallbackSchema)) {
        seen.add(row.name);
        const derived = compactParamToFormatHint(row);
        if (derived) {
            resolved.push(derived);
        }
    }
    for (const hint of explicitHints !== null && explicitHints !== void 0 ? explicitHints : []) {
        if (!seen.has(hint.param)) {
            resolved.push(hint);
        }
    }
    return resolved;
}
exports.resolveParamFormatHints = resolveParamFormatHints;
function syncAgentMetadataParamFormatHints(metadata, inputSchema, fallbackSchema) {
    const derived = resolveParamFormatHints(inputSchema, fallbackSchema !== null && fallbackSchema !== void 0 ? fallbackSchema : null);
    if (derived.length === 0) {
        const { paramFormatHints: _removed } = metadata, rest = __rest(metadata, ["paramFormatHints"]);
        return rest;
    }
    return Object.assign(Object.assign({}, metadata), { paramFormatHints: derived });
}
exports.syncAgentMetadataParamFormatHints = syncAgentMetadataParamFormatHints;
function normalizeAgentMetadataForPersist(raw, inputSchema, fallbackSchema) {
    if (!isRecord(raw)) {
        return null;
    }
    const row = Object.assign({}, raw);
    delete row.paramFormatHints;
    const normalized = (0, tool_agent_metadata_util_1.normalizeAgentMetadata)(row);
    if (!normalized) {
        return null;
    }
    const { paramFormatHints: _removed } = normalized, base = __rest(normalized, ["paramFormatHints"]);
    return syncAgentMetadataParamFormatHints(base, inputSchema, fallbackSchema);
}
exports.normalizeAgentMetadataForPersist = normalizeAgentMetadataForPersist;
function enrichParamWithFormatHint(row, hintByParam) {
    const hint = hintByParam.get(row.name);
    if (!hint) {
        return row;
    }
    const suffix = formatParamFormatHintSuffix(hint);
    return Object.assign(Object.assign({}, row), { description: row.description
            ? `${row.description} ${suffix}`
            : suffix });
}
function applyParamFormatHintsToCompactInput(input, hints) {
    var _a;
    if (hints.length === 0) {
        return input;
    }
    const hintByParam = new Map(hints.map((row) => [row.param, row]));
    return Object.assign(Object.assign({}, input), { parameters: input.parameters.map((row) => enrichParamWithFormatHint(row, hintByParam)), requestBody: input.requestBody
            ? Object.assign(Object.assign({}, input.requestBody), { properties: (_a = input.requestBody.properties) === null || _a === void 0 ? void 0 : _a.map((row) => enrichParamWithFormatHint(row, hintByParam)) }) : input.requestBody });
}
exports.applyParamFormatHintsToCompactInput = applyParamFormatHintsToCompactInput;
function buildCompactToolInput(inputSchema, fallbackSchema, agentMetadata) {
    var _a;
    const document = resolveOpenApiInputDocument(inputSchema, fallbackSchema);
    if (!document) {
        return { parameters: [], requestBody: null };
    }
    const all = extractParametersFromOpenApiDocument(document);
    const requestBody = extractRequestBodyFromOpenApiDocument(document);
    if (all.length === 0 && !requestBody) {
        return { parameters: [], requestBody: requestBody !== null && requestBody !== void 0 ? requestBody : null };
    }
    const meta = (0, tool_agent_metadata_util_1.parseAgentMetadata)(agentMetadata);
    const businessFields = (_a = meta === null || meta === void 0 ? void 0 : meta.businessFields) !== null && _a !== void 0 ? _a : [];
    const required = all.filter((row) => row.required);
    const optional = prioritizeOptionalParams(all.filter((row) => !row.required), businessFields);
    return finalizeCompactToolInput({
        parameters: [...required, ...optional],
        requestBody: requestBody !== null && requestBody !== void 0 ? requestBody : null,
    }, meta, inputSchema, fallbackSchema);
}
exports.buildCompactToolInput = buildCompactToolInput;
function finalizeCompactToolInput(compact, meta, inputSchema, fallbackSchema) {
    const hints = resolveParamFormatHints(inputSchema, fallbackSchema, meta === null || meta === void 0 ? void 0 : meta.paramFormatHints);
    return hints.length > 0
        ? applyParamFormatHintsToCompactInput(compact, hints)
        : compact;
}
function listRequiredParamNames(input) {
    var _a, _b, _c;
    const fromParameters = input.parameters
        .filter((row) => row.required)
        .map((row) => row.name);
    const fromBody = (_c = (_b = (_a = input.requestBody) === null || _a === void 0 ? void 0 : _a.properties) === null || _b === void 0 ? void 0 : _b.filter((row) => row.required).map((row) => row.name)) !== null && _c !== void 0 ? _c : [];
    return [...new Set([...fromParameters, ...fromBody])];
}
exports.listRequiredParamNames = listRequiredParamNames;
//# sourceMappingURL=tool-decision-input.util.js.map