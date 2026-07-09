"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveToolJsonSchema = exports.resolveToolZodSchema = void 0;
const json_schema_to_zod_util_1 = require("./json-schema-to-zod.util");
function resolveToolZodSchema(inputSchema, fallbackSchema) {
    return (0, json_schema_to_zod_util_1.jsonSchemaToZod)(resolveToolJsonSchema(inputSchema, fallbackSchema));
}
exports.resolveToolZodSchema = resolveToolZodSchema;
function resolveToolJsonSchema(inputSchema, fallbackSchema) {
    const primary = normalizeJsonSchemaLike(inputSchema);
    if (primary) {
        return primary;
    }
    const fallback = normalizeJsonSchemaLike(fallbackSchema);
    if (fallback) {
        return fallback;
    }
    return emptyObjectJsonSchema();
}
exports.resolveToolJsonSchema = resolveToolJsonSchema;
function emptyObjectJsonSchema() {
    return {
        type: 'object',
        properties: {},
        additionalProperties: false,
    };
}
function finalizeObjectJsonSchema(schema) {
    if (schema.type !== 'object') {
        return schema;
    }
    return Object.assign(Object.assign({}, schema), { additionalProperties: false });
}
function normalizeJsonSchemaLike(source) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) {
        return null;
    }
    const row = source;
    if (isStandardJsonSchema(row)) {
        return finalizeObjectJsonSchema(row);
    }
    const byParameters = convertOpenApiParameters(row);
    if (byParameters) {
        return byParameters;
    }
    const byRequestBody = convertOpenApiRequestBody(row);
    if (byRequestBody) {
        return byRequestBody;
    }
    return null;
}
function isStandardJsonSchema(value) {
    const type = value.type;
    const properties = value.properties;
    return (type === 'object' &&
        properties !== null &&
        typeof properties === 'object' &&
        !Array.isArray(properties));
}
function convertOpenApiParameters(value) {
    const parameters = value.parameters;
    if (!Array.isArray(parameters) || parameters.length === 0) {
        return null;
    }
    const properties = {};
    const required = [];
    for (const item of parameters) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            continue;
        }
        const param = item;
        const name = param.name;
        if (typeof name !== 'string' || name.trim().length === 0) {
            continue;
        }
        properties[name] = convertParameterSchema(param);
        if (param.required === true) {
            required.push(name);
        }
    }
    const result = {
        type: 'object',
        properties,
        additionalProperties: false,
    };
    if (required.length > 0) {
        result.required = Array.from(new Set(required));
    }
    return result;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function convertNestedJsonSchema(node) {
    var _a;
    const ref = (_a = node.$ref) !== null && _a !== void 0 ? _a : node.originalRef;
    if (typeof ref === 'string' && ref.trim().length > 0) {
        return { $ref: ref.trim() };
    }
    const typeRaw = typeof node.type === 'string' ? node.type : undefined;
    const type = typeRaw ? mapOpenApiType(typeRaw) : undefined;
    const out = {};
    if (typeof node.description === 'string' && node.description.trim().length > 0) {
        out.description = node.description.trim();
    }
    if (Array.isArray(node.enum) && node.enum.length > 0) {
        out.enum = node.enum;
    }
    if (typeof node.format === 'string' && node.format.trim().length > 0) {
        out.format = node.format.trim();
    }
    if (type === 'array' && isRecord(node.items)) {
        out.type = 'array';
        out.items = convertNestedJsonSchema(node.items);
        return out;
    }
    if (type === 'object' || isRecord(node.properties)) {
        out.type = 'object';
        const properties = isRecord(node.properties) ? node.properties : {};
        const props = {};
        for (const [key, raw] of Object.entries(properties)) {
            if (isRecord(raw)) {
                props[key] = convertNestedJsonSchema(raw);
            }
        }
        out.properties = props;
        if (Array.isArray(node.required)) {
            out.required = node.required.filter((field) => typeof field === 'string');
        }
        return finalizeObjectJsonSchema(out);
    }
    out.type = type !== null && type !== void 0 ? type : 'string';
    return out;
}
function convertParameterSchema(param) {
    const nested = param.schema;
    if (isRecord(nested)) {
        const schema = convertNestedJsonSchema(nested);
        const description = param.description;
        if (typeof description === 'string' &&
            description.trim().length > 0 &&
            (typeof schema.description !== 'string' || schema.description.length === 0)) {
            schema.description = description.trim();
        }
        return schema;
    }
    const schema = {};
    const type = param.type;
    if (typeof type === 'string') {
        schema.type = mapOpenApiType(type);
    }
    else {
        schema.type = 'string';
    }
    const description = param.description;
    if (typeof description === 'string' && description.trim().length > 0) {
        schema.description = description;
    }
    const enumValue = param.enum;
    if (Array.isArray(enumValue) && enumValue.length > 0) {
        schema.enum = enumValue;
    }
    const items = param.items;
    if (schema.type === 'array' &&
        isRecord(items)) {
        schema.items = convertNestedJsonSchema(items);
    }
    if (schema.type === 'object' && isRecord(param.properties)) {
        return convertNestedJsonSchema({
            type: 'object',
            properties: param.properties,
            required: param.required,
            description: schema.description,
        });
    }
    return schema;
}
function mapOpenApiType(value) {
    switch (value) {
        case 'integer':
        case 'number':
        case 'string':
        case 'boolean':
        case 'array':
        case 'object':
            return value;
        default:
            return 'string';
    }
}
function convertOpenApiRequestBody(value) {
    const requestBody = value.requestBody;
    if (!requestBody ||
        typeof requestBody !== 'object' ||
        Array.isArray(requestBody)) {
        return null;
    }
    const body = requestBody;
    const content = body.content;
    if (!content || typeof content !== 'object' || Array.isArray(content)) {
        return null;
    }
    const contentRow = content;
    const appJson = contentRow['application/json'];
    if (!appJson || typeof appJson !== 'object' || Array.isArray(appJson)) {
        return null;
    }
    const appJsonRow = appJson;
    const schema = appJsonRow.schema;
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
        return null;
    }
    return finalizeObjectJsonSchema(schema);
}
//# sourceMappingURL=tool-schema.util.js.map