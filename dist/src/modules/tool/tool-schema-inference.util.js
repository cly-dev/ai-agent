"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferToolSchemasFromSample = void 0;
const field_description_util_1 = require("../../core/tool-engine/field-description.util");
const tool_output_projection_util_1 = require("../../core/tool-engine/tool-output-projection.util");
const tool_pagination_params_util_1 = require("../../core/tool-engine/tool-pagination-params.util");
const tool_response_profile_spec_util_1 = require("../../core/tool-engine/tool-response-profile.spec.util");
const tool_agent_metadata_util_1 = require("../../core/tool-engine/tool-agent-metadata.util");
const tool_decision_role_enum_1 = require("../../core/tool-engine/tool-decision-role.enum");
const CORE_FIELD_CANDIDATES = [
    'id',
    'code',
    'message',
    'success',
    'name',
    'title',
    'status',
    'state',
    'type',
    'createdAt',
    'updatedAt',
    'gmtCreate',
    'gmtModify',
];
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function toFieldContext(input) {
    return {
        toolName: input.toolName,
        toolDescription: input.toolDescription,
    };
}
function truncateSample(value, depth = 0) {
    if (depth > 4) {
        return '[truncated]';
    }
    if (Array.isArray(value)) {
        return value.slice(0, 2).map((item) => truncateSample(item, depth + 1));
    }
    if (isRecord(value)) {
        const next = {};
        for (const [key, item] of Object.entries(value).slice(0, 40)) {
            next[key] = truncateSample(item, depth + 1);
        }
        return next;
    }
    if (typeof value === 'string' && value.length > 200) {
        return `${value.slice(0, 200)}…`;
    }
    return value;
}
function inferJsonSchemaFromSample(value, fieldName, context) {
    if (value === null) {
        const schema = { type: 'null' };
        if (fieldName) {
            schema.description = (0, field_description_util_1.inferFieldDescription)(fieldName, value, context);
        }
        return schema;
    }
    if (Array.isArray(value)) {
        const schema = {
            type: 'array',
            items: value.length > 0
                ? inferJsonSchemaFromSample(value[0], undefined, context)
                : { type: 'object' },
        };
        if (fieldName) {
            schema.description = (0, field_description_util_1.inferFieldDescription)(fieldName, value, context);
        }
        return schema;
    }
    if (isRecord(value)) {
        const properties = {};
        for (const [key, item] of Object.entries(value)) {
            properties[key] = inferJsonSchemaFromSample(item, key, context);
        }
        const schema = { type: 'object', properties };
        if (fieldName) {
            schema.description = (0, field_description_util_1.inferFieldDescription)(fieldName, value, context);
        }
        return schema;
    }
    if (typeof value === 'number') {
        const schema = Number.isInteger(value)
            ? { type: 'integer' }
            : { type: 'number' };
        if (fieldName) {
            schema.description = (0, field_description_util_1.inferFieldDescription)(fieldName, value, context);
        }
        return schema;
    }
    if (typeof value === 'boolean') {
        const schema = { type: 'boolean' };
        if (fieldName) {
            schema.description = (0, field_description_util_1.inferFieldDescription)(fieldName, value, context);
        }
        return schema;
    }
    const schema = { type: 'string' };
    if (fieldName) {
        schema.description = (0, field_description_util_1.inferFieldDescription)(fieldName, value, context);
    }
    return schema;
}
function enrichSchemaNode(schema, sample, fieldName, context) {
    const next = Object.assign({}, schema);
    const description = next.description;
    if (typeof description !== 'string' || description.trim().length === 0) {
        next.description = (0, field_description_util_1.inferFieldDescription)(fieldName, sample, context);
    }
    if (next.type === 'object' && isRecord(next.properties)) {
        const properties = Object.assign({}, next.properties);
        for (const [key, propSchema] of Object.entries(properties)) {
            if (!isRecord(propSchema)) {
                continue;
            }
            const childSample = isRecord(sample) ? sample[key] : undefined;
            properties[key] = enrichSchemaNode(propSchema, childSample, key, context);
        }
        next.properties = properties;
    }
    if (next.type === 'array' && isRecord(next.items)) {
        const sampleItem = Array.isArray(sample) ? sample[0] : undefined;
        next.items = enrichSchemaNode(next.items, sampleItem, fieldName, context);
    }
    return next;
}
function enrichOutputSchema(outputSchema, sampleData, context) {
    const enriched = {};
    for (const [statusCode, responseSpec] of Object.entries(outputSchema)) {
        if (!isRecord(responseSpec)) {
            enriched[statusCode] = responseSpec;
            continue;
        }
        const nextSpec = Object.assign({}, responseSpec);
        if (isRecord(nextSpec.schema)) {
            nextSpec.schema = enrichSchemaNode(nextSpec.schema, sampleData, 'response', context);
        }
        if (typeof nextSpec.description !== 'string' ||
            nextSpec.description.trim().length === 0) {
            nextSpec.description = '接口成功响应体';
        }
        enriched[statusCode] = nextSpec;
    }
    return enriched;
}
function buildOutputSchema(httpStatus, sampleData, context) {
    return {
        [String(httpStatus)]: {
            description: '接口成功响应体',
            schema: inferJsonSchemaFromSample(sampleData, 'response', context),
        },
    };
}
function getByPath(root, path) {
    const segments = path.split('.').filter(Boolean);
    let current = root;
    for (const segment of segments) {
        if (!isRecord(current)) {
            return undefined;
        }
        current = current[segment];
    }
    return current;
}
function collectLeafPaths(value, prefix = '', depth = 0, acc = []) {
    if (depth > 3) {
        return acc;
    }
    if (Array.isArray(value)) {
        if (prefix) {
            acc.push(prefix);
        }
        if (value.length > 0 && isRecord(value[0])) {
            for (const key of Object.keys(value[0]).slice(0, 30)) {
                collectLeafPaths(value[0][key], prefix ? `${prefix}.${key}` : key, depth + 1, acc);
            }
        }
        return acc;
    }
    if (isRecord(value)) {
        for (const [key, item] of Object.entries(value)) {
            const nextPath = prefix ? `${prefix}.${key}` : key;
            if (item !== null && typeof item === 'object') {
                collectLeafPaths(item, nextPath, depth + 1, acc);
            }
            else {
                acc.push(nextPath);
            }
        }
        return acc;
    }
    if (prefix) {
        acc.push(prefix);
    }
    return acc;
}
function detectListPath(sampleData) {
    for (const candidate of tool_response_profile_spec_util_1.RESPONSE_PROFILE_LIST_PATH_CANDIDATES) {
        const value = getByPath(sampleData, candidate);
        if (Array.isArray(value)) {
            return candidate;
        }
    }
    return undefined;
}
function buildFieldSpec(path, sampleRoot, context) {
    var _a;
    const fieldKey = (_a = path.split('.').pop()) !== null && _a !== void 0 ? _a : path;
    const sampleValue = getByPath(sampleRoot, path);
    return {
        path,
        label: (0, field_description_util_1.inferFieldLabel)(fieldKey),
        description: (0, field_description_util_1.inferFieldDescription)(fieldKey, sampleValue, context),
        keywords: [(0, field_description_util_1.inferFieldLabel)(fieldKey), fieldKey],
    };
}
function buildFallbackResponseProfile(sampleData, context) {
    var _a;
    const listPath = detectListPath(sampleData);
    const sampleRoot = listPath != null
        ? getByPath(sampleData, listPath)[0]
        : sampleData;
    const paths = collectLeafPaths(sampleRoot !== null && sampleRoot !== void 0 ? sampleRoot : sampleData);
    const normalizedPaths = [...new Set(paths)];
    const corePaths = normalizedPaths.filter((path) => {
        var _a;
        const last = (_a = path.split('.').pop()) !== null && _a !== void 0 ? _a : path;
        return CORE_FIELD_CANDIDATES.includes(last);
    });
    const fallbackCore = corePaths.length > 0 ? corePaths : normalizedPaths.slice(0, 8);
    const coreSet = new Set(fallbackCore);
    const optionalPaths = normalizedPaths.filter((path) => !coreSet.has(path));
    const profile = {
        coreFields: fallbackCore.map((path) => buildFieldSpec(path, sampleRoot !== null && sampleRoot !== void 0 ? sampleRoot : sampleData, context)),
        optionalFields: optionalPaths.slice(0, 20).map((path) => buildFieldSpec(path, sampleRoot !== null && sampleRoot !== void 0 ? sampleRoot : sampleData, context)),
        arrayLimits: listPath
            ? {
                [(_a = listPath.split('.').filter(Boolean).pop()) !== null && _a !== void 0 ? _a : 'data']: (0, tool_pagination_params_util_1.resolveDefaultListArrayLimit)(),
            }
            : undefined,
        listPath,
        listMetaFields: listPath
            ? ['total', 'page', 'pageSize', 'pages']
                .map((key) => buildFieldSpec(key, sampleData, context))
                .filter((field) => getByPath(sampleData, field.path) !== undefined)
            : undefined,
    };
    const parsed = (0, tool_output_projection_util_1.parseResponseProfile)(profile);
    if (!parsed) {
        return (0, tool_response_profile_spec_util_1.assertValidResponseProfile)({
            coreFields: [
                {
                    path: 'value',
                    label: '结果',
                    description: '接口返回结果',
                },
            ],
        }, sampleData);
    }
    return (0, tool_response_profile_spec_util_1.assertValidResponseProfile)(parsed, sampleData);
}
function enrichResponseProfile(profile, sampleData, context) {
    var _a;
    const listPath = profile.listPath;
    const sampleRoot = listPath != null
        ? (_a = getByPath(sampleData, listPath)) === null || _a === void 0 ? void 0 : _a[0]
        : sampleData;
    const enrichFields = (fields) => fields.map((field) => {
        var _a, _b, _c;
        const fieldKey = (_a = field.path.split('.').pop()) !== null && _a !== void 0 ? _a : field.path;
        const sampleValue = getByPath(sampleRoot !== null && sampleRoot !== void 0 ? sampleRoot : sampleData, field.path);
        return Object.assign(Object.assign({}, field), { label: ((_b = field.label) === null || _b === void 0 ? void 0 : _b.trim()) || (0, field_description_util_1.inferFieldLabel)(fieldKey), description: ((_c = field.description) === null || _c === void 0 ? void 0 : _c.trim()) ||
                (0, field_description_util_1.inferFieldDescription)(fieldKey, sampleValue, context) });
    });
    return Object.assign(Object.assign({}, profile), { coreFields: enrichFields(profile.coreFields), optionalFields: profile.optionalFields
            ? enrichFields(profile.optionalFields)
            : undefined, listMetaFields: profile.listMetaFields
            ? enrichFields(profile.listMetaFields)
            : undefined });
}
function extractJsonObject(content) {
    var _a, _b;
    const trimmed = content.trim();
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = (_b = (_a = fenced === null || fenced === void 0 ? void 0 : fenced[1]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : trimmed;
    try {
        const parsed = JSON.parse(candidate);
        return isRecord(parsed) ? parsed : null;
    }
    catch (_c) {
        const start = candidate.indexOf('{');
        const end = candidate.lastIndexOf('}');
        if (start < 0 || end <= start) {
            return null;
        }
        try {
            const parsed = JSON.parse(candidate.slice(start, end + 1));
            return isRecord(parsed) ? parsed : null;
        }
        catch (_d) {
            return null;
        }
    }
}
function buildFallbackSchemas(input) {
    const context = toFieldContext(input);
    const { metadata, source: agentMetadataSource } = (0, tool_agent_metadata_util_1.resolveInferredAgentMetadata)(undefined, {
        method: input.method,
        path: input.path,
        toolName: input.toolName,
        toolDescription: input.toolDescription,
        inputSchema: input.inputSchema,
        existingAgentMetadata: input.agentMetadata,
    });
    return finalizeInferredSchemas(buildOutputSchema(input.httpStatus, input.sampleData, context), buildFallbackResponseProfile(input.sampleData, context), metadata, input, 'fallback', agentMetadataSource);
}
function applyDecisionRoleFromHttpMethod(profile, method) {
    if (profile.decisionRole && profile.decisionRole !== 'unknown') {
        return profile;
    }
    const inferred = (0, tool_decision_role_enum_1.inferDecisionRoleFromHttpMethod)(method);
    return inferred ? Object.assign(Object.assign({}, profile), { decisionRole: inferred }) : profile;
}
function finalizeInferredSchemas(outputSchema, responseProfile, agentMetadata, input, source, agentMetadataSource) {
    const context = toFieldContext(input);
    const enriched = enrichResponseProfile(responseProfile, input.sampleData, context);
    const withHttpRole = applyDecisionRoleFromHttpMethod(enriched, input.method);
    const withRole = (0, tool_agent_metadata_util_1.applyDecisionRoleToResponseProfile)(withHttpRole, {
        agentMetadata,
        method: input.method,
        name: input.toolName,
        description: input.toolDescription,
    });
    return {
        outputSchema: enrichOutputSchema(outputSchema, input.sampleData, context),
        responseProfile: (0, tool_response_profile_spec_util_1.assertValidResponseProfile)(withRole, input.sampleData),
        agentMetadata,
        source,
        agentMetadataSource,
    };
}
async function inferToolSchemasFromSample(llmService, input, systemPrompt) {
    var _a, _b;
    const fallback = buildFallbackSchemas(input);
    const sample = truncateSample(input.sampleData);
    try {
        const result = await llmService.chat({
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: [
                        `toolName: ${input.toolName}`,
                        `description: ${input.toolDescription}`,
                        `method: ${input.method}`,
                        `path: ${input.path}`,
                        `httpStatus: ${input.httpStatus}`,
                        input.hint ? `hint: ${input.hint}` : null,
                        input.agentMetadata
                            ? `existingAgentMetadata: ${JSON.stringify(truncateSample(input.agentMetadata, 0))}`
                            : null,
                        `sample: ${JSON.stringify(sample)}`,
                    ]
                        .filter((line) => line != null)
                        .join('\n'),
                },
            ],
            temperature: 0.2,
            maxTokens: 4096,
            stream: false,
            budgetHints: { callKind: 'schema_inference', skipFit: true },
        });
        const parsed = extractJsonObject((_a = result.content) !== null && _a !== void 0 ? _a : '');
        if (!parsed) {
            return buildFallbackSchemas(input);
        }
        const outputSchema = isRecord(parsed.outputSchema)
            ? parsed.outputSchema
            : fallback.outputSchema;
        const responseProfile = (_b = (0, tool_output_projection_util_1.parseResponseProfile)(parsed.responseProfile)) !== null && _b !== void 0 ? _b : fallback.responseProfile;
        const { metadata, source: agentMetadataSource } = (0, tool_agent_metadata_util_1.resolveInferredAgentMetadata)(parsed.agentMetadata, {
            method: input.method,
            path: input.path,
            toolName: input.toolName,
            toolDescription: input.toolDescription,
            inputSchema: input.inputSchema,
            existingAgentMetadata: input.agentMetadata,
        });
        return finalizeInferredSchemas(outputSchema, responseProfile, metadata, input, 'llm', agentMetadataSource);
    }
    catch (_c) {
        return buildFallbackSchemas(input);
    }
}
exports.inferToolSchemasFromSample = inferToolSchemasFromSample;
//# sourceMappingURL=tool-schema-inference.util.js.map