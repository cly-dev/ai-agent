"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveInferredAgentMetadata = exports.applyDecisionRoleToResponseProfile = exports.mergeDecisionRoleIntoResponseProfile = exports.buildToolEmbedTextFromMetadata = exports.sortToolsByMetadataPriority = exports.filterToolsByAgentMetadata = exports.parseUserToolIntent = exports.extractProvidesFromResponseProfile = exports.resolveToolDecisionRole = exports.inferAgentMetadataFromOpenApi = exports.normalizeAgentMetadata = exports.parseAgentMetadata = void 0;
const tool_decision_role_enum_1 = require("./tool-decision-role.enum");
const tool_output_projection_util_1 = require("./tool-output-projection.util");
const tool_agent_metadata_types_1 = require("./tool-agent-metadata.types");
const WRITE_INTENT_RE = /\b(create|update|delete|remove|save|submit|publish|unpublish|batch|set|adjust|enable|disable)\b/i;
const READ_INTENT_RE = /\b(get|search|find|list|detail|query|fetch|retrieve|show|view|count|status|price|inventory|stock|how many|what is)\b/i;
const READ_LIST_SEARCH_HINT_RE = /\b(list|lists|search|find|query|filter|where|which|all|any|multiple|page|pages|condition|criteria|less than|greater than|below|above|between|under|over)\b|<|>|<=|>=/i;
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function asStringArray(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0);
}
function parseParamFormatHints(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    const rows = [];
    for (const item of value) {
        if (!isRecord(item)) {
            continue;
        }
        const param = typeof item.param === 'string' ? item.param.trim() : '';
        const hint = typeof item.hint === 'string' ? item.hint.trim() : '';
        if (!param || !hint) {
            continue;
        }
        const example = typeof item.example === 'string' && item.example.trim().length > 0
            ? item.example.trim()
            : undefined;
        rows.push(example ? { param, hint, example } : { param, hint });
    }
    return rows;
}
function parseDraftReviewPolicy(value) {
    if (!isRecord(value)) {
        return null;
    }
    const editMode = pickEnum(value.editMode, tool_agent_metadata_types_1.DRAFT_REVIEW_EDIT_MODES);
    const submitPath = typeof value.submitPath === 'string' && value.submitPath.trim().length > 0
        ? value.submitPath.trim()
        : undefined;
    const editablePaths = asStringArray(value.editablePaths);
    const lockedPaths = asStringArray(value.lockedPaths);
    const fieldOverrides = parseDraftReviewFieldOverrides(value.fieldOverrides);
    const allowArgumentsPatch = typeof value.allowArgumentsPatch === 'boolean'
        ? value.allowArgumentsPatch
        : undefined;
    if (!editMode &&
        !submitPath &&
        editablePaths.length === 0 &&
        lockedPaths.length === 0 &&
        fieldOverrides.length === 0 &&
        allowArgumentsPatch === undefined) {
        return null;
    }
    return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (editMode ? { editMode } : {})), (submitPath ? { submitPath } : {})), (editablePaths.length > 0 ? { editablePaths } : {})), (lockedPaths.length > 0 ? { lockedPaths } : {})), (fieldOverrides.length > 0 ? { fieldOverrides } : {})), (allowArgumentsPatch !== undefined ? { allowArgumentsPatch } : {}));
}
function parseDraftReviewFieldOverrides(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    const rows = [];
    for (const item of value) {
        if (!isRecord(item)) {
            continue;
        }
        const path = typeof item.path === 'string' ? item.path.trim() : '';
        if (!path) {
            continue;
        }
        const role = pickEnum(item.role, tool_agent_metadata_types_1.DRAFT_REVIEW_FIELD_ROLES);
        const label = typeof item.label === 'string' && item.label.trim().length > 0
            ? item.label.trim()
            : undefined;
        const reason = typeof item.reason === 'string' && item.reason.trim().length > 0
            ? item.reason.trim()
            : undefined;
        const widget = typeof item.widget === 'string' &&
            ['text', 'textarea', 'select', 'hidden'].includes(item.widget)
            ? item.widget
            : undefined;
        rows.push(Object.assign(Object.assign(Object.assign(Object.assign({ path }, (role ? { role } : {})), (label ? { label } : {})), (reason ? { reason } : {})), (widget ? { widget } : {})));
    }
    return rows;
}
function pickEnum(value, allowed) {
    if (typeof value !== 'string') {
        return undefined;
    }
    const normalized = value.trim().toUpperCase();
    return allowed.includes(normalized) ? normalized : undefined;
}
function parseAgentMetadata(raw) {
    if (!isRecord(raw)) {
        return null;
    }
    const mode = pickEnum(raw.mode, Object.values(tool_agent_metadata_types_1.ToolMode));
    const resource = pickEnum(raw.resource, Object.values(tool_agent_metadata_types_1.ResourceType));
    const operation = pickEnum(raw.operation, Object.values(tool_agent_metadata_types_1.OperationType));
    if (!mode || !resource || !operation) {
        return null;
    }
    const businessFields = asStringArray(raw.businessFields);
    const aliases = asStringArray(raw.aliases);
    const examples = asStringArray(raw.examples);
    const priority = typeof raw.priority === 'number' && Number.isFinite(raw.priority)
        ? Math.round(raw.priority)
        : mode === tool_agent_metadata_types_1.ToolMode.WRITE
            ? 200
            : 100;
    const isMutation = typeof raw.isMutation === 'boolean' ? raw.isMutation : mode === tool_agent_metadata_types_1.ToolMode.WRITE;
    const paramFormatHints = parseParamFormatHints(raw.paramFormatHints);
    const draftReview = parseDraftReviewPolicy(raw.draftReview);
    return Object.assign(Object.assign({ mode,
        resource,
        operation,
        businessFields,
        aliases,
        examples,
        priority,
        isMutation }, (paramFormatHints.length > 0 ? { paramFormatHints } : {})), (draftReview ? { draftReview } : {}));
}
exports.parseAgentMetadata = parseAgentMetadata;
function normalizeAgentMetadata(raw) {
    const parsed = parseAgentMetadata(raw);
    if (!parsed) {
        return null;
    }
    return Object.assign(Object.assign({}, parsed), { isMutation: parsed.mode === tool_agent_metadata_types_1.ToolMode.WRITE });
}
exports.normalizeAgentMetadata = normalizeAgentMetadata;
function inferResourceFromText(text) {
    if (/\b(price|pricing|cost)\b/i.test(text)) {
        return tool_agent_metadata_types_1.ResourceType.PRICE;
    }
    if (/\b(inventory|stock)\b/i.test(text)) {
        return tool_agent_metadata_types_1.ResourceType.INVENTORY;
    }
    if (/\bseo\b/i.test(text)) {
        return tool_agent_metadata_types_1.ResourceType.SEO;
    }
    if (/\b(category|categories)\b/i.test(text)) {
        return tool_agent_metadata_types_1.ResourceType.CATEGORY;
    }
    if (/\b(collection|collections)\b/i.test(text)) {
        return tool_agent_metadata_types_1.ResourceType.COLLECTION;
    }
    if (/\b(order|orders)\b/i.test(text)) {
        return tool_agent_metadata_types_1.ResourceType.ORDER;
    }
    if (/\b(customer|customers)\b/i.test(text)) {
        return tool_agent_metadata_types_1.ResourceType.CUSTOMER;
    }
    return tool_agent_metadata_types_1.ResourceType.PRODUCT;
}
function inferOperationForRead(text) {
    if (/\b(stats?|statistics|metrics?|count)\b/i.test(text)) {
        return tool_agent_metadata_types_1.OperationType.STATS;
    }
    if (READ_LIST_SEARCH_HINT_RE.test(text)) {
        return tool_agent_metadata_types_1.OperationType.LIST;
    }
    return tool_agent_metadata_types_1.OperationType.DETAIL;
}
function inferBusinessFields(resource, operation, inputSchema) {
    const fromSchema = extractRequiredParamNamesFromInputSchema(inputSchema);
    const mapped = fromSchema.map((name) => mapApiParamToBusinessField(name));
    const base = [];
    switch (resource) {
        case tool_agent_metadata_types_1.ResourceType.PRICE:
            if (operation === tool_agent_metadata_types_1.OperationType.UPDATE) {
                base.push('skuId', 'price');
            }
            break;
        case tool_agent_metadata_types_1.ResourceType.INVENTORY:
            if (operation === tool_agent_metadata_types_1.OperationType.UPDATE) {
                base.push('skuId', 'inventory');
            }
            break;
        case tool_agent_metadata_types_1.ResourceType.PRODUCT:
            if (operation === tool_agent_metadata_types_1.OperationType.DETAIL ||
                operation === tool_agent_metadata_types_1.OperationType.CREATE ||
                operation === tool_agent_metadata_types_1.OperationType.UPDATE) {
                base.push('productId');
            }
            break;
        default:
            break;
    }
    return [...new Set([...base, ...mapped])].slice(0, 12);
}
function mapApiParamToBusinessField(param) {
    const lower = param.toLowerCase();
    if (lower === 'id') {
        return 'productId';
    }
    if (lower.includes('skuid') || lower === 'sku') {
        return 'skuId';
    }
    if (lower.includes('price')) {
        return 'price';
    }
    if (lower.includes('inventory')) {
        return 'inventory';
    }
    return param;
}
function extractRequiredParamNamesFromInputSchema(inputSchema) {
    if (!isRecord(inputSchema)) {
        return [];
    }
    const params = inputSchema.parameters;
    if (!Array.isArray(params)) {
        return [];
    }
    return params
        .map((item) => {
        if (!isRecord(item)) {
            return null;
        }
        if (item.required !== true) {
            return null;
        }
        const name = item.name;
        return typeof name === 'string' && name.trim() ? name.trim() : null;
    })
        .filter((name) => name != null);
}
function inferAliases(resource, description) {
    const aliases = [];
    const desc = description.trim();
    if (desc) {
        aliases.push(desc);
    }
    switch (resource) {
        case tool_agent_metadata_types_1.ResourceType.PRICE:
            aliases.push('price', 'pricing', 'cost');
            break;
        case tool_agent_metadata_types_1.ResourceType.INVENTORY:
            aliases.push('inventory', 'stock');
            break;
        case tool_agent_metadata_types_1.ResourceType.PRODUCT:
            aliases.push('product', 'product detail', 'product info');
            break;
        default:
            break;
    }
    return [...new Set(aliases)].slice(0, 16);
}
function inferAgentMetadataFromOpenApi(input) {
    const method = input.method.trim().toLowerCase();
    const text = `${input.name} ${input.description} ${input.path}`.toLowerCase();
    let mode = tool_agent_metadata_types_1.ToolMode.READ;
    if (/\b(cache|debug|test data|clear|purge)\b/i.test(text)) {
        mode = tool_agent_metadata_types_1.ToolMode.ADMIN;
    }
    else if (method === 'get') {
        mode = tool_agent_metadata_types_1.ToolMode.READ;
    }
    else {
        mode = tool_agent_metadata_types_1.ToolMode.WRITE;
    }
    const resource = inferResourceFromText(text);
    let operation = tool_agent_metadata_types_1.OperationType.DETAIL;
    if (mode === tool_agent_metadata_types_1.ToolMode.ADMIN) {
        operation = tool_agent_metadata_types_1.OperationType.UPDATE;
    }
    else if (mode === tool_agent_metadata_types_1.ToolMode.READ) {
        operation = inferOperationForRead(text);
    }
    else if (method === 'post') {
        operation = tool_agent_metadata_types_1.OperationType.CREATE;
    }
    else if (method === 'delete') {
        operation = tool_agent_metadata_types_1.OperationType.DELETE;
    }
    else {
        operation = tool_agent_metadata_types_1.OperationType.UPDATE;
    }
    const businessFields = inferBusinessFields(resource, operation, input.inputSchema);
    const aliases = inferAliases(resource, input.description);
    const priority = mode === tool_agent_metadata_types_1.ToolMode.WRITE ? 200 : 100;
    return normalizeAgentMetadata({
        mode,
        resource,
        operation,
        businessFields,
        aliases,
        examples: [],
        priority,
        isMutation: mode === tool_agent_metadata_types_1.ToolMode.WRITE,
    });
}
exports.inferAgentMetadataFromOpenApi = inferAgentMetadataFromOpenApi;
function resolveToolDecisionRole(source) {
    const meta = parseAgentMetadata(source.agentMetadata);
    const fromMeta = (0, tool_decision_role_enum_1.deriveDecisionRoleFromAgentMetadata)(meta);
    if (fromMeta) {
        return fromMeta;
    }
    if (isRecord(source.responseProfile)) {
        const explicit = (0, tool_decision_role_enum_1.parseConfiguredToolDecisionRole)(source.responseProfile.decisionRole);
        if (explicit) {
            return explicit;
        }
    }
    if (source.method) {
        const fromHttp = (0, tool_decision_role_enum_1.inferDecisionRoleFromHttpMethod)(source.method);
        if (fromHttp) {
            return fromHttp;
        }
    }
    return 'unknown';
}
exports.resolveToolDecisionRole = resolveToolDecisionRole;
function extractProvidesFromResponseProfile(responseProfile) {
    var _a;
    const profile = (0, tool_output_projection_util_1.parseResponseProfile)(responseProfile);
    if (!profile) {
        return [];
    }
    const paths = [
        ...profile.coreFields.map((field) => field.label || field.path),
        ...((_a = profile.optionalFields) !== null && _a !== void 0 ? _a : []).slice(0, 6).map((field) => field.label || field.path),
    ];
    return [...new Set(paths.filter((item) => item.length > 0))].slice(0, 12);
}
exports.extractProvidesFromResponseProfile = extractProvidesFromResponseProfile;
function isListLikeOperation(operation) {
    return (operation === tool_agent_metadata_types_1.OperationType.LIST || operation === tool_agent_metadata_types_1.OperationType.SEARCH);
}
function operationsCompatible(intentOp, metaOp) {
    if (!intentOp) {
        return true;
    }
    if (intentOp === metaOp) {
        return true;
    }
    return isListLikeOperation(intentOp) && isListLikeOperation(metaOp);
}
function parseUserToolIntent(userMessage) {
    const text = userMessage.trim();
    if (!text) {
        return {};
    }
    const intent = {};
    if (WRITE_INTENT_RE.test(text)) {
        intent.mode = tool_agent_metadata_types_1.ToolMode.WRITE;
    }
    else if (READ_INTENT_RE.test(text)) {
        intent.mode = tool_agent_metadata_types_1.ToolMode.READ;
    }
    if (intent.mode === tool_agent_metadata_types_1.ToolMode.READ && /\b(product|products|sku|item|items)\b/i.test(text)) {
        intent.resource = tool_agent_metadata_types_1.ResourceType.PRODUCT;
    }
    else if (/\b(price|pricing|cost)\b/i.test(text)) {
        intent.resource = tool_agent_metadata_types_1.ResourceType.PRICE;
    }
    else if (/\b(inventory|stock)\b/i.test(text)) {
        intent.resource = tool_agent_metadata_types_1.ResourceType.INVENTORY;
    }
    if (intent.mode === tool_agent_metadata_types_1.ToolMode.READ) {
        if (/\b(product|products)\b/i.test(text) &&
            (/\b(inventory|stock)\b/i.test(text) || READ_LIST_SEARCH_HINT_RE.test(text))) {
            intent.resource = tool_agent_metadata_types_1.ResourceType.PRODUCT;
            intent.operation = tool_agent_metadata_types_1.OperationType.SEARCH;
        }
        else if (/\b(inventory|stock)\b/i.test(text) &&
            READ_LIST_SEARCH_HINT_RE.test(text)) {
            intent.resource = tool_agent_metadata_types_1.ResourceType.PRODUCT;
            intent.operation = tool_agent_metadata_types_1.OperationType.SEARCH;
        }
        else if (/\b(stats?|statistics|count|metrics?)\b/i.test(text)) {
            intent.operation = tool_agent_metadata_types_1.OperationType.STATS;
        }
        else if (READ_LIST_SEARCH_HINT_RE.test(text)) {
            intent.operation = tool_agent_metadata_types_1.OperationType.SEARCH;
        }
        else if (/\b(list|lists)\b/i.test(text)) {
            intent.operation = tool_agent_metadata_types_1.OperationType.LIST;
        }
        else {
            intent.operation = tool_agent_metadata_types_1.OperationType.DETAIL;
        }
    }
    if (intent.mode === tool_agent_metadata_types_1.ToolMode.WRITE) {
        if (/\b(create|add|new)\b/i.test(text)) {
            intent.operation = tool_agent_metadata_types_1.OperationType.CREATE;
        }
        else if (/\b(delete|remove)\b/i.test(text)) {
            intent.operation = tool_agent_metadata_types_1.OperationType.DELETE;
        }
        else if (/\b(update|modify|set|adjust|change)\b/i.test(text)) {
            intent.operation = tool_agent_metadata_types_1.OperationType.UPDATE;
        }
    }
    return intent;
}
exports.parseUserToolIntent = parseUserToolIntent;
function metadataMatchesIntent(meta, intent, options) {
    if (intent.mode && meta.mode !== intent.mode) {
        return false;
    }
    if (intent.resource && meta.resource !== intent.resource) {
        return false;
    }
    if (intent.operation && !(options === null || options === void 0 ? void 0 : options.relaxOperation)) {
        if (!operationsCompatible(intent.operation, meta.operation)) {
            return false;
        }
    }
    return true;
}
function filterWithIntent(withMeta, intent, options) {
    return withMeta.filter((tool) => {
        const meta = parseAgentMetadata(tool.agentMetadata);
        if (!meta) {
            return false;
        }
        return metadataMatchesIntent(meta, intent, options);
    });
}
function filterToolsByAgentMetadata(tools, userMessage) {
    var _a;
    const intent = parseUserToolIntent(userMessage);
    if (!intent.mode && !intent.resource && !intent.operation) {
        return sortToolsByMetadataPriority(tools);
    }
    const withMeta = [];
    const withoutMeta = [];
    for (const tool of tools) {
        const meta = parseAgentMetadata(tool.agentMetadata);
        if (meta) {
            withMeta.push(tool);
        }
        else {
            withoutMeta.push(tool);
        }
    }
    let matched = filterWithIntent(withMeta, intent);
    if (matched.length === 0 && intent.resource === tool_agent_metadata_types_1.ResourceType.INVENTORY) {
        const productSearchIntent = Object.assign(Object.assign({}, intent), { resource: tool_agent_metadata_types_1.ResourceType.PRODUCT, operation: (_a = intent.operation) !== null && _a !== void 0 ? _a : tool_agent_metadata_types_1.OperationType.SEARCH });
        matched = filterWithIntent(withMeta, productSearchIntent);
    }
    if (matched.length === 0) {
        matched = filterWithIntent(withMeta, intent, { relaxOperation: true });
    }
    if (matched.length > 0) {
        return sortToolsByMetadataPriority(matched);
    }
    if (withMeta.length > 0) {
        return sortToolsByMetadataPriority(withMeta);
    }
    return sortToolsByMetadataPriority(tools);
}
exports.filterToolsByAgentMetadata = filterToolsByAgentMetadata;
function sortToolsByMetadataPriority(tools) {
    return [...tools].sort((a, b) => {
        var _a, _b, _c, _d;
        const pa = (_b = (_a = parseAgentMetadata(a.agentMetadata)) === null || _a === void 0 ? void 0 : _a.priority) !== null && _b !== void 0 ? _b : 0;
        const pb = (_d = (_c = parseAgentMetadata(b.agentMetadata)) === null || _c === void 0 ? void 0 : _c.priority) !== null && _d !== void 0 ? _d : 0;
        return pb - pa;
    });
}
exports.sortToolsByMetadataPriority = sortToolsByMetadataPriority;
function buildToolEmbedTextFromMetadata(tool) {
    const meta = parseAgentMetadata(tool.agentMetadata);
    const parts = [tool.name.trim(), tool.description.trim()];
    if (meta) {
        parts.push(meta.mode, meta.resource, meta.operation, ...meta.aliases, ...meta.examples);
    }
    return parts.filter((line) => line.length > 0).join('\n');
}
exports.buildToolEmbedTextFromMetadata = buildToolEmbedTextFromMetadata;
function mergeDecisionRoleIntoResponseProfile(responseProfile, agentMetadata, method) {
    var _a, _b;
    const base = isRecord(responseProfile) ? Object.assign({}, responseProfile) : {};
    const role = (_b = (_a = (0, tool_decision_role_enum_1.deriveDecisionRoleFromAgentMetadata)(agentMetadata)) !== null && _a !== void 0 ? _a : (0, tool_decision_role_enum_1.parseConfiguredToolDecisionRole)(base.decisionRole)) !== null && _b !== void 0 ? _b : (0, tool_decision_role_enum_1.inferDecisionRoleFromHttpMethod)(method);
    if (role) {
        base.decisionRole = role;
    }
    return base;
}
exports.mergeDecisionRoleIntoResponseProfile = mergeDecisionRoleIntoResponseProfile;
function applyDecisionRoleToResponseProfile(profile, source) {
    const role = resolveToolDecisionRole(source);
    if (role === 'unknown') {
        return profile;
    }
    return Object.assign(Object.assign({}, profile), { decisionRole: role });
}
exports.applyDecisionRoleToResponseProfile = applyDecisionRoleToResponseProfile;
function resolveInferredAgentMetadata(llmRaw, input) {
    const fromLlm = parseAgentMetadata(llmRaw);
    if (fromLlm) {
        return { metadata: fromLlm, source: 'llm' };
    }
    const existing = parseAgentMetadata(input.existingAgentMetadata);
    if (existing) {
        return { metadata: existing, source: 'existing' };
    }
    const heuristic = inferAgentMetadataFromOpenApi({
        method: input.method,
        path: input.path,
        name: input.toolName,
        description: input.toolDescription,
        inputSchema: input.inputSchema,
    });
    return { metadata: heuristic, source: 'heuristic' };
}
exports.resolveInferredAgentMetadata = resolveInferredAgentMetadata;
//# sourceMappingURL=tool-agent-metadata.util.js.map