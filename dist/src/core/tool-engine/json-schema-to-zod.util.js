"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonSchemaToZod = void 0;
const zod_1 = require("zod");
function jsonSchemaToZod(schema) {
    const type = schema.type;
    if (type === 'object') {
        return jsonSchemaObjectToZod(schema);
    }
    return jsonSchemaPropertyToZod(schema);
}
exports.jsonSchemaToZod = jsonSchemaToZod;
function jsonSchemaObjectToZod(schema) {
    const properties = schema.properties;
    if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
        return zod_1.z.object({}).strict();
    }
    const required = new Set(Array.isArray(schema.required)
        ? schema.required.filter((item) => typeof item === 'string')
        : []);
    const shape = {};
    for (const [key, propSchema] of Object.entries(properties)) {
        if (!propSchema || typeof propSchema !== 'object' || Array.isArray(propSchema)) {
            shape[key] = zod_1.z.unknown().optional();
            continue;
        }
        let field = jsonSchemaPropertyToZod(propSchema);
        if (!required.has(key)) {
            field = field.optional();
        }
        shape[key] = field;
    }
    return zod_1.z.object(shape).strict();
}
function jsonSchemaPropertyToZod(schema) {
    const enumValues = schema.enum;
    if (Array.isArray(enumValues) && enumValues.length > 0) {
        return applyDescription(wrapEnum(enumValues), schema);
    }
    const type = typeof schema.type === 'string' ? schema.type : 'string';
    switch (type) {
        case 'integer': {
            return applyDescription(zod_1.z.coerce.number().int(), schema);
        }
        case 'number': {
            return applyDescription(zod_1.z.coerce.number(), schema);
        }
        case 'boolean': {
            return applyDescription(zod_1.z.coerce.boolean(), schema);
        }
        case 'array': {
            const items = schema.items;
            const itemSchema = items && typeof items === 'object' && !Array.isArray(items)
                ? jsonSchemaPropertyToZod(items)
                : zod_1.z.unknown();
            return applyDescription(zod_1.z.array(itemSchema), schema);
        }
        case 'object': {
            return applyDescription(jsonSchemaObjectToZod(schema), schema);
        }
        case 'string':
        default: {
            return applyDescription(zod_1.z.string(), schema);
        }
    }
}
function wrapEnum(values) {
    if (values.every((item) => typeof item === 'string') && values.length > 0) {
        return zod_1.z.enum(values);
    }
    if (values.every((item) => typeof item === 'number') && values.length > 0) {
        return zod_1.z.union(values.map((item) => zod_1.z.literal(item)));
    }
    if (values.every((item) => typeof item === 'boolean') && values.length > 0) {
        return zod_1.z.union(values.map((item) => zod_1.z.literal(item)));
    }
    return zod_1.z.unknown();
}
function applyDescription(field, schema) {
    const description = schema.description;
    if (typeof description === 'string' && description.trim().length > 0) {
        return field.describe(description.trim());
    }
    return field;
}
//# sourceMappingURL=json-schema-to-zod.util.js.map