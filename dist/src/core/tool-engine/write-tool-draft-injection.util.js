"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePrimaryWriteToolSubmitPath = exports.readValueAtWriteToolParamPath = exports.findMissingRequiredWriteToolArgPath = exports.normalizeWriteToolArguments = exports.enrichWriteArgumentsFromPageContext = exports.enrichWriteArgumentsFromSelf = exports.enrichWriteToolArgumentsFromReadObservations = exports.mergeWriteToolArgumentsByParamPaths = exports.assignWriteToolArgumentAtParamPath = exports.satisfiesRequiredWriteToolArgs = exports.injectDraftIntoWriteToolArguments = exports.resolveEffectiveWriteToolSubmitPath = exports.writeToolArgsContainSubmitText = exports.formatWriteToolArgumentsForUserPreview = exports.writeToolHasSubmitBodyPath = exports.extractSubmitTextFromWriteArguments = exports.extractSubmitTextFromDraftReply = exports.resolveWriteToolSubmitPaths = exports.isUsablePlanDraftSubmitText = void 0;
const tool_decision_input_util_1 = require("./tool-decision-input.util");
const tool_agent_metadata_util_1 = require("./tool-agent-metadata.util");
const tool_param_path_alias_util_1 = require("./tool-param-path-alias.util");
const tool_input_sanitize_util_1 = require("./tool-input-sanitize.util");
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isPresent(value) {
    return value !== undefined && value !== null && value !== '';
}
function lastPathSegment(path) {
    var _a;
    const normalized = path.replace(/\[\]/g, '');
    const parts = normalized.split('.');
    return (_a = parts[parts.length - 1]) !== null && _a !== void 0 ? _a : path;
}
function isStringParamType(type) {
    if (!type) {
        return false;
    }
    const normalized = type.trim().toLowerCase();
    return normalized === 'string' || normalized.startsWith('string(');
}
function isEnumLikeParam(row) {
    return Array.isArray(row.enum) && row.enum.length > 0;
}
function isUsablePlanDraftSubmitText(text) {
    const trimmed = text.trim();
    if (!trimmed) {
        return false;
    }
    if (/^`+$/.test(trimmed)) {
        return false;
    }
    if (/^```[\w-]*\s*```$/.test(trimmed)) {
        return false;
    }
    if (trimmed.startsWith('```') && !/```[\s\S]+```/.test(trimmed)) {
        return false;
    }
    return true;
}
exports.isUsablePlanDraftSubmitText = isUsablePlanDraftSubmitText;
function resolveWriteToolSubmitPaths(writeTool) {
    var _a;
    const specs = (0, tool_input_sanitize_util_1.collectOpenApiParameterSpecs)(writeTool.inputSchema).length > 0
        ? (0, tool_input_sanitize_util_1.collectOpenApiParameterSpecs)(writeTool.inputSchema)
        : (0, tool_input_sanitize_util_1.collectOpenApiParameterSpecs)(writeTool.schema);
    const compactParams = (0, tool_decision_input_util_1.listToolInputCompactParams)(writeTool.inputSchema, writeTool.schema);
    const meta = (0, tool_agent_metadata_util_1.parseAgentMetadata)(writeTool.agentMetadata);
    const businessFields = new Set((_a = meta === null || meta === void 0 ? void 0 : meta.businessFields) !== null && _a !== void 0 ? _a : []);
    const bodyRoot = resolveBodyRootParam(specs, compactParams);
    const identifierLeaves = new Set(businessFields);
    const arrayItemStringPaths = [];
    const nestedStringPaths = [];
    const topLevelStringPaths = [];
    for (const row of compactParams) {
        if (!isStringParamType(row.type)) {
            continue;
        }
        if (isEnumLikeParam(row)) {
            continue;
        }
        const leaf = lastPathSegment(row.name);
        if (businessFields.has(leaf) || businessFields.has(row.name)) {
            identifierLeaves.add(leaf);
            continue;
        }
        if (row.in && row.in !== 'body' && !row.name.includes('.')) {
            continue;
        }
        if (row.name.includes('[]')) {
            arrayItemStringPaths.push(row.name);
            continue;
        }
        if (row.name.includes('.')) {
            nestedStringPaths.push(row.name);
            continue;
        }
        if (row.in === 'body' || !row.in) {
            topLevelStringPaths.push(row.name);
        }
    }
    for (const row of compactParams) {
        if (!row.required) {
            continue;
        }
        const leaf = lastPathSegment(row.name);
        if (!isStringParamType(row.type)) {
            identifierLeaves.add(leaf);
        }
    }
    return {
        arrayItemStringPaths,
        nestedStringPaths,
        topLevelStringPaths,
        bodyRoot,
        identifierLeaves,
    };
}
exports.resolveWriteToolSubmitPaths = resolveWriteToolSubmitPaths;
function pickPrimaryWriteToolSubmitPath(paths, compactParams) {
    var _a, _b;
    const candidates = [
        ...paths.arrayItemStringPaths,
        ...paths.nestedStringPaths,
        ...paths.topLevelStringPaths,
    ];
    if (candidates.length === 0) {
        return null;
    }
    const byName = new Map(compactParams.map((row) => [row.name, row]));
    const scored = candidates.map((path) => {
        const row = byName.get(path);
        let score = 0;
        if (row && !row.required) {
            score += 2;
        }
        if (row === null || row === void 0 ? void 0 : row.description) {
            score += Math.min(row.description.length, 200) / 100;
        }
        if (path.includes('[]')) {
            score += 1;
        }
        return { path, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return (_b = (_a = scored[0]) === null || _a === void 0 ? void 0 : _a.path) !== null && _b !== void 0 ? _b : null;
}
function resolveBodyRootParam(specs, compactParams) {
    var _a;
    const bodySpec = specs.find((spec) => spec.in === 'body');
    if (bodySpec === null || bodySpec === void 0 ? void 0 : bodySpec.name) {
        return bodySpec.name;
    }
    const objectBody = compactParams.find((row) => { var _a, _b; return row.in === 'body' && ((_b = (_a = row.type) === null || _a === void 0 ? void 0 : _a.startsWith('object')) !== null && _b !== void 0 ? _b : false); });
    return (_a = objectBody === null || objectBody === void 0 ? void 0 : objectBody.name) !== null && _a !== void 0 ? _a : null;
}
function flattenBodyScopes(source, bodyRoot) {
    const scopes = [source];
    if (bodyRoot && isRecord(source[bodyRoot])) {
        scopes.push(source[bodyRoot]);
    }
    return scopes;
}
function findNestedValueByLeaf(source, leaf, bodyRoot) {
    for (const scope of flattenBodyScopes(source, bodyRoot)) {
        if (leaf in scope && isPresent(scope[leaf])) {
            return scope[leaf];
        }
    }
    function walk(value) {
        if (isRecord(value)) {
            if (leaf in value && isPresent(value[leaf])) {
                return value[leaf];
            }
            for (const nested of Object.values(value)) {
                const found = walk(nested);
                if (isPresent(found)) {
                    return found;
                }
            }
        }
        else if (Array.isArray(value)) {
            for (const item of value) {
                const found = walk(item);
                if (isPresent(found)) {
                    return found;
                }
            }
        }
        return undefined;
    }
    return walk(source);
}
function pickIdentifierFields(source, paths) {
    const out = {};
    for (const leaf of paths.identifierLeaves) {
        const value = findNestedValueByLeaf(source, leaf, paths.bodyRoot);
        if (isPresent(value)) {
            out[leaf] = value;
        }
    }
    return out;
}
function readValueAtParamPath(args, path) {
    if (!path.includes('[]')) {
        const segments = path.split('.').filter(Boolean);
        let cursor = args;
        for (const segment of segments) {
            if (!isRecord(cursor) || !(segment in cursor)) {
                return undefined;
            }
            cursor = cursor[segment];
        }
        return cursor;
    }
    const segments = path.split('.').filter(Boolean);
    let values = [args];
    for (const segment of segments) {
        const throughArrayItems = segment.endsWith('[]');
        const key = throughArrayItems ? segment.slice(0, -2) : segment;
        const next = [];
        for (const value of values) {
            if (!isRecord(value) || !(key in value)) {
                continue;
            }
            const child = value[key];
            if (throughArrayItems) {
                if (!Array.isArray(child)) {
                    continue;
                }
                for (const item of child) {
                    next.push(item);
                }
            }
            else {
                next.push(child);
            }
        }
        values = next;
        if (values.length === 0) {
            return undefined;
        }
    }
    if (values.length === 1) {
        return values[0];
    }
    return values;
}
function extractSubmitTextFromDraftReply(draft) {
    const trimmed = draft.trim();
    if (!trimmed) {
        return '';
    }
    const fences = [...trimmed.matchAll(/```[\w-]*\n([\s\S]*?)```/g)];
    for (let i = fences.length - 1; i >= 0; i -= 1) {
        const inner = fences[i][1].trim();
        if (!inner || inner.startsWith('{') || inner.startsWith('[')) {
            continue;
        }
        return inner;
    }
    return trimmed;
}
exports.extractSubmitTextFromDraftReply = extractSubmitTextFromDraftReply;
function extractSubmitTextFromWriteArguments(args, writeTool) {
    const compactParams = (0, tool_decision_input_util_1.listToolInputCompactParams)(writeTool.inputSchema, writeTool.schema);
    const paths = resolveWriteToolSubmitPaths(writeTool);
    const primaryPath = pickPrimaryWriteToolSubmitPath(paths, compactParams);
    if (!primaryPath) {
        return null;
    }
    if (primaryPath.includes('[]')) {
        const value = readValueAtParamPath(args, primaryPath);
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }
        if (Array.isArray(value)) {
            for (const item of value) {
                if (typeof item === 'string' && item.trim()) {
                    return item.trim();
                }
            }
        }
        return null;
    }
    const value = readValueAtParamPath(args, primaryPath);
    if (typeof value === 'string' && value.trim()) {
        return value.trim();
    }
    return null;
}
exports.extractSubmitTextFromWriteArguments = extractSubmitTextFromWriteArguments;
function ensureRecordAtPath(root, pathParts) {
    let cursor = root;
    for (const part of pathParts) {
        const existing = cursor[part];
        const next = isRecord(existing) ? Object.assign({}, existing) : {};
        cursor[part] = next;
        cursor = next;
    }
    return cursor;
}
function applyArrayItemStringDraft(args, path, submitText, identifierFields) {
    var _a;
    const match = /^(.+)\[\]\.(.+)$/.exec(path);
    if (!match) {
        return;
    }
    const arrayPath = match[1];
    const itemField = match[2];
    const parts = arrayPath.split('.');
    const arrayKey = (_a = parts[parts.length - 1]) !== null && _a !== void 0 ? _a : arrayPath;
    const parentParts = parts.slice(0, -1);
    const parent = parentParts.length > 0
        ? ensureRecordAtPath(args, parentParts)
        : args;
    const existing = parent[arrayKey];
    if (Array.isArray(existing) && existing.length > 0) {
        parent[arrayKey] = existing.map((item) => {
            if (!isRecord(item)) {
                return item;
            }
            return Object.assign(Object.assign({}, item), { [itemField]: submitText });
        });
        return;
    }
    parent[arrayKey] = [
        Object.assign(Object.assign({}, identifierFields), { [itemField]: submitText }),
    ];
}
function applyNestedStringDraft(args, path, submitText) {
    const parts = path.split('.');
    const leaf = parts[parts.length - 1];
    const parentParts = parts.slice(0, -1);
    const parent = parentParts.length > 0 ? ensureRecordAtPath(args, parentParts) : args;
    parent[leaf] = submitText;
}
function applyTopLevelStringDraft(args, field, submitText, bodyRoot) {
    if (bodyRoot) {
        const bodyValue = args[bodyRoot];
        const existing = isRecord(bodyValue) ? Object.assign({}, bodyValue) : {};
        existing[field] = submitText;
        args[bodyRoot] = existing;
        return;
    }
    args[field] = submitText;
}
function writeToolHasSubmitBodyPath(writeTool) {
    const compactParams = (0, tool_decision_input_util_1.listToolInputCompactParams)(writeTool.inputSchema, writeTool.schema);
    const paths = resolveWriteToolSubmitPaths(writeTool);
    return pickPrimaryWriteToolSubmitPath(paths, compactParams) != null;
}
exports.writeToolHasSubmitBodyPath = writeToolHasSubmitBodyPath;
function formatPreviewValue(value) {
    if (!isPresent(value)) {
        return null;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    if (Array.isArray(value)) {
        const parts = value
            .map((item) => formatPreviewValue(item))
            .filter((item) => item != null);
        return parts.length > 0 ? parts.join(', ') : null;
    }
    if (isRecord(value)) {
        try {
            return JSON.stringify(value);
        }
        catch (_a) {
            return null;
        }
    }
    return null;
}
function formatWriteToolArgumentsForUserPreview(args, writeTool, toolDescription, options) {
    var _a;
    const compactParams = (0, tool_decision_input_util_1.listToolInputCompactParams)(writeTool.inputSchema, writeTool.schema);
    const submitPaths = (options === null || options === void 0 ? void 0 : options.excludeSubmitBody)
        ? resolveWriteToolSubmitPaths(writeTool)
        : null;
    const primarySubmitPath = submitPaths != null
        ? pickPrimaryWriteToolSubmitPath(submitPaths, compactParams)
        : null;
    const lines = [];
    if ((toolDescription === null || toolDescription === void 0 ? void 0 : toolDescription.trim()) && !(options === null || options === void 0 ? void 0 : options.excludeSubmitBody)) {
        lines.push(toolDescription.trim());
    }
    for (const row of compactParams) {
        if (primarySubmitPath &&
            (row.name === primarySubmitPath ||
                row.name.startsWith(`${primarySubmitPath}.`))) {
            continue;
        }
        if (row.name.includes('[]')) {
            const match = /^(.+)\[\]\.(.+)$/.exec(row.name);
            if (!match) {
                continue;
            }
            const arrayValue = readValueAtParamPath(args, match[1]);
            if (!Array.isArray(arrayValue)) {
                continue;
            }
            arrayValue.forEach((item, index) => {
                var _a;
                if (!isRecord(item)) {
                    return;
                }
                if (primarySubmitPath &&
                    row.name === primarySubmitPath) {
                    return;
                }
                const text = formatPreviewValue(item[match[2]]);
                if (text) {
                    const label = ((_a = row.description) === null || _a === void 0 ? void 0 : _a.trim()) || row.name;
                    lines.push(`- ${label} (${index + 1}): ${text}`);
                }
            });
            continue;
        }
        const text = formatPreviewValue(readValueAtParamPath(args, row.name));
        if (!text) {
            continue;
        }
        const label = ((_a = row.description) === null || _a === void 0 ? void 0 : _a.trim()) || row.name;
        lines.push(`- ${label}: ${text}`);
    }
    if (lines.length === 0) {
        return '';
    }
    return lines.join('\n');
}
exports.formatWriteToolArgumentsForUserPreview = formatWriteToolArgumentsForUserPreview;
function writeToolArgsContainSubmitText(args, writeTool) {
    return extractSubmitTextFromWriteArguments(args, writeTool) != null;
}
exports.writeToolArgsContainSubmitText = writeToolArgsContainSubmitText;
function resolveEffectiveWriteToolSubmitPath(writeTool) {
    var _a, _b, _c;
    const compactParams = (0, tool_decision_input_util_1.listToolInputCompactParams)(writeTool.inputSchema, writeTool.schema);
    const configured = (_c = (_b = (_a = (0, tool_agent_metadata_util_1.parseAgentMetadata)(writeTool.agentMetadata)) === null || _a === void 0 ? void 0 : _a.draftReview) === null || _b === void 0 ? void 0 : _b.submitPath) === null || _c === void 0 ? void 0 : _c.trim();
    if (configured) {
        const paramPaths = new Set(compactParams.map((row) => row.name));
        const resolved = (0, tool_param_path_alias_util_1.resolveArrayItemParamPathAlias)(configured, paramPaths);
        if (paramPaths.has(resolved)) {
            return resolved;
        }
    }
    return pickPrimaryWriteToolSubmitPath(resolveWriteToolSubmitPaths(writeTool), compactParams);
}
exports.resolveEffectiveWriteToolSubmitPath = resolveEffectiveWriteToolSubmitPath;
function injectDraftIntoWriteToolArguments(args, submitText, writeTool) {
    const trimmed = submitText.trim();
    if (!trimmed) {
        return args;
    }
    const paths = resolveWriteToolSubmitPaths(writeTool);
    const compactParams = (0, tool_decision_input_util_1.listToolInputCompactParams)(writeTool.inputSchema, writeTool.schema);
    const primaryPath = resolveEffectiveWriteToolSubmitPath(writeTool);
    const next = JSON.parse(JSON.stringify(args));
    if (!primaryPath) {
        return next;
    }
    const identifierFields = pickIdentifierFields(next, paths);
    if (primaryPath.includes('[]')) {
        applyArrayItemStringDraft(next, primaryPath, trimmed, identifierFields);
        return next;
    }
    if (primaryPath.includes('.')) {
        applyNestedStringDraft(next, primaryPath, trimmed);
        return next;
    }
    applyTopLevelStringDraft(next, primaryPath, trimmed, paths.bodyRoot);
    return next;
}
exports.injectDraftIntoWriteToolArguments = injectDraftIntoWriteToolArguments;
function isPresentAtWriteToolParamPath(args, path) {
    const value = readValueAtParamPath(args, path);
    if (Array.isArray(value)) {
        return value.some((item) => isPresent(item));
    }
    return isPresent(value);
}
function satisfiesRequiredWriteToolArgs(args, writeTool) {
    const compactParams = (0, tool_decision_input_util_1.listToolInputCompactParams)(writeTool.inputSchema, writeTool.schema);
    const requiredPaths = compactParams
        .filter((row) => row.required)
        .map((row) => row.name);
    if (requiredPaths.length === 0) {
        const compact = (0, tool_decision_input_util_1.buildCompactToolInput)(writeTool.inputSchema, writeTool.schema, writeTool.agentMetadata);
        for (const name of (0, tool_decision_input_util_1.listRequiredParamNames)(compact)) {
            if (!isPresent(args[name])) {
                return false;
            }
        }
        return true;
    }
    for (const path of requiredPaths) {
        if (!isPresentAtWriteToolParamPath(args, path)) {
            return false;
        }
    }
    return true;
}
exports.satisfiesRequiredWriteToolArgs = satisfiesRequiredWriteToolArgs;
function setValueAtParamPath(root, path, value, bodyRoot) {
    var _a;
    if (path.includes('[]')) {
        const match = /^(.+)\[\]\.(.+)$/.exec(path);
        if (!match) {
            return;
        }
        const arrayPath = match[1];
        const itemField = match[2];
        const parts = arrayPath.split('.');
        const arrayKey = (_a = parts[parts.length - 1]) !== null && _a !== void 0 ? _a : arrayPath;
        const parentParts = parts.slice(0, -1);
        const parent = parentParts.length > 0 ? ensureRecordAtPath(root, parentParts) : root;
        const existing = parent[arrayKey];
        if (Array.isArray(existing) && existing.length > 0) {
            parent[arrayKey] = existing.map((item) => {
                if (!isRecord(item) || isPresent(item[itemField])) {
                    return item;
                }
                return Object.assign(Object.assign({}, item), { [itemField]: value });
            });
        }
        return;
    }
    if (path.includes('.')) {
        const parts = path.split('.');
        const leaf = parts[parts.length - 1];
        const parentParts = parts.slice(0, -1);
        const parent = parentParts.length > 0 ? ensureRecordAtPath(root, parentParts) : root;
        parent[leaf] = value;
        return;
    }
    if (bodyRoot) {
        const bodyValue = root[bodyRoot];
        const body = isRecord(bodyValue) ? Object.assign({}, bodyValue) : {};
        body[path] = value;
        root[bodyRoot] = body;
        return;
    }
    root[path] = value;
}
function assignWriteToolArgumentAtParamPath(root, path, value, bodyRoot) {
    var _a;
    if (path.includes('[]')) {
        const match = /^(.+)\[\]\.(.+)$/.exec(path);
        if (!match) {
            return;
        }
        const arrayPath = match[1];
        const itemField = match[2];
        const parts = arrayPath.split('.');
        const arrayKey = (_a = parts[parts.length - 1]) !== null && _a !== void 0 ? _a : arrayPath;
        const parentParts = parts.slice(0, -1);
        const parent = parentParts.length > 0 ? ensureRecordAtPath(root, parentParts) : root;
        const existing = parent[arrayKey];
        if (Array.isArray(existing) && existing.length > 0) {
            parent[arrayKey] = existing.map((item) => isRecord(item) ? Object.assign(Object.assign({}, item), { [itemField]: value }) : item);
            return;
        }
        parent[arrayKey] = [{ [itemField]: value }];
        return;
    }
    setValueAtParamPath(root, path, value, bodyRoot);
}
exports.assignWriteToolArgumentAtParamPath = assignWriteToolArgumentAtParamPath;
function mergeWriteToolArgumentsByParamPaths(base, patch, writeTool) {
    const next = JSON.parse(JSON.stringify(base));
    const bodyRoot = resolveWriteToolSubmitPaths(writeTool).bodyRoot;
    for (const [path, value] of Object.entries(patch)) {
        assignWriteToolArgumentAtParamPath(next, path, value, bodyRoot);
    }
    return next;
}
exports.mergeWriteToolArgumentsByParamPaths = mergeWriteToolArgumentsByParamPaths;
function collectReadObservationRecords(observations, isReadToolObservation) {
    const out = [];
    for (const obs of observations) {
        if (!isReadToolObservation(obs.name)) {
            continue;
        }
        const output = obs.output;
        if (!isRecord(output) || output._agentToolError === true) {
            continue;
        }
        out.push(output);
    }
    return out;
}
function resolveReadArrayFromRecords(readRecords, arrayPath) {
    for (const record of readRecords) {
        const direct = readValueAtParamPath(record, arrayPath);
        if (Array.isArray(direct) && direct.length > 0) {
            return direct;
        }
        const leaf = arrayPath.split('.').pop();
        const leafValue = leaf ? record[leaf] : undefined;
        if (leaf && Array.isArray(leafValue) && leafValue.length > 0) {
            return leafValue;
        }
    }
    return null;
}
function mergeWriteArrayItemFieldsFromReadRecords(args, arrayPath, fields, readRecords) {
    var _a;
    const writeArray = readValueAtParamPath(args, arrayPath);
    if (!Array.isArray(writeArray) || writeArray.length === 0) {
        return;
    }
    const readArray = resolveReadArrayFromRecords(readRecords, arrayPath);
    if (!readArray) {
        return;
    }
    const parts = arrayPath.split('.');
    const arrayKey = (_a = parts[parts.length - 1]) !== null && _a !== void 0 ? _a : arrayPath;
    const parentParts = parts.slice(0, -1);
    const parent = parentParts.length > 0 ? ensureRecordAtPath(args, parentParts) : args;
    parent[arrayKey] = writeArray.map((item, index) => {
        if (!isRecord(item)) {
            return item;
        }
        const readItem = isRecord(readArray[index])
            ? readArray[index]
            : isRecord(readArray[0])
                ? readArray[0]
                : null;
        if (!readItem) {
            return item;
        }
        const next = Object.assign({}, item);
        for (const field of fields) {
            if (!isPresent(next[field]) && isPresent(readItem[field])) {
                next[field] = readItem[field];
            }
        }
        return next;
    });
}
function enrichWriteToolArgumentsFromReadObservations(args, writeTool, observations, input) {
    var _a;
    const readRecords = collectReadObservationRecords(observations, input.isReadToolObservation);
    if (readRecords.length === 0) {
        return args;
    }
    const paths = resolveWriteToolSubmitPaths(writeTool);
    const compactParams = (0, tool_decision_input_util_1.listToolInputCompactParams)(writeTool.inputSchema, writeTool.schema);
    const requiredPaths = compactParams
        .filter((row) => row.required)
        .map((row) => row.name);
    if (requiredPaths.length === 0) {
        const compact = (0, tool_decision_input_util_1.buildCompactToolInput)(writeTool.inputSchema, writeTool.schema, writeTool.agentMetadata);
        for (const name of (0, tool_decision_input_util_1.listRequiredParamNames)(compact)) {
            requiredPaths.push(name);
        }
    }
    const next = JSON.parse(JSON.stringify(args));
    for (const path of requiredPaths) {
        if (isPresentAtWriteToolParamPath(next, path)) {
            continue;
        }
        const leaf = lastPathSegment(path.replace(/\[\]/g, ''));
        for (const record of readRecords) {
            let value = readValueAtParamPath(record, path);
            if (!isPresent(value)) {
                value = findNestedValueByLeaf(record, leaf, paths.bodyRoot);
            }
            if (isPresent(value)) {
                setValueAtParamPath(next, path, value, paths.bodyRoot);
                break;
            }
        }
    }
    const primaryPath = pickPrimaryWriteToolSubmitPath(paths, compactParams);
    const primaryLeaf = primaryPath
        ? lastPathSegment(primaryPath.replace(/\[\]/g, ''))
        : null;
    const arrayMergeFields = new Map();
    for (const row of compactParams) {
        if (!row.name.includes('[]')) {
            continue;
        }
        const match = /^(.+)\[\]\.(.+)$/.exec(row.name);
        if (!match) {
            continue;
        }
        const leaf = match[2];
        if (primaryLeaf && leaf === primaryLeaf) {
            continue;
        }
        const fields = (_a = arrayMergeFields.get(match[1])) !== null && _a !== void 0 ? _a : new Set();
        fields.add(leaf);
        arrayMergeFields.set(match[1], fields);
    }
    for (const [arrayPath, fields] of arrayMergeFields) {
        mergeWriteArrayItemFieldsFromReadRecords(next, arrayPath, [...fields], readRecords);
    }
    return next;
}
exports.enrichWriteToolArgumentsFromReadObservations = enrichWriteToolArgumentsFromReadObservations;
function enrichWriteArgumentsFromSelf(args, writeTool) {
    const compactParams = (0, tool_decision_input_util_1.listToolInputCompactParams)(writeTool.inputSchema, writeTool.schema);
    let requiredPaths = compactParams
        .filter((row) => row.required)
        .map((row) => row.name);
    if (requiredPaths.length === 0) {
        const compact = (0, tool_decision_input_util_1.buildCompactToolInput)(writeTool.inputSchema, writeTool.schema, writeTool.agentMetadata);
        requiredPaths = (0, tool_decision_input_util_1.listRequiredParamNames)(compact);
    }
    const paths = resolveWriteToolSubmitPaths(writeTool);
    const next = JSON.parse(JSON.stringify(args));
    for (const path of requiredPaths) {
        if (isPresentAtWriteToolParamPath(next, path)) {
            continue;
        }
        const normalizedPath = path.replace(/\[\]/g, '');
        const leaf = lastPathSegment(normalizedPath);
        const isTopLevelRequired = !normalizedPath.includes('.') && !path.includes('[');
        if (!isTopLevelRequired && !paths.identifierLeaves.has(leaf)) {
            continue;
        }
        const value = findNestedValueByLeaf(next, leaf, paths.bodyRoot);
        if (isPresent(value)) {
            setValueAtParamPath(next, path, value, paths.bodyRoot);
        }
    }
    return next;
}
exports.enrichWriteArgumentsFromSelf = enrichWriteArgumentsFromSelf;
function isIntegerLikeParamType(type) {
    if (!type) {
        return false;
    }
    const normalized = type.trim().toLowerCase();
    return (normalized === 'integer' ||
        normalized === 'int' ||
        normalized.startsWith('integer(') ||
        normalized.includes('int64') ||
        normalized.includes('int32'));
}
function isArrayLikeParamRow(row) {
    var _a, _b;
    const type = (_b = (_a = row.type) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase()) !== null && _b !== void 0 ? _b : '';
    return type.startsWith('array') || row.name.includes('[]');
}
function isPageContextValueCompatibleWithParam(value, row) {
    if (!isPresent(value)) {
        return false;
    }
    if (isArrayLikeParamRow(row)) {
        return Array.isArray(value);
    }
    if (isIntegerLikeParamType(row.type)) {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return Number.isInteger(value);
        }
        if (typeof value === 'string') {
            return /^\d+$/.test(value.trim());
        }
        return false;
    }
    return true;
}
function collectReadIdentifierValuesByLeaf(observations, isReadToolObservation, identifierLeaves, businessFields) {
    const out = new Map();
    const readRecords = collectReadObservationRecords(observations, isReadToolObservation);
    for (const record of readRecords) {
        for (const leaf of identifierLeaves) {
            if (out.has(leaf)) {
                continue;
            }
            const direct = record[leaf];
            if (isPresent(direct)) {
                out.set(leaf, direct);
                continue;
            }
            if (businessFields.has(leaf) && isPresent(record.id)) {
                out.set(leaf, record.id);
            }
        }
    }
    return out;
}
function enrichWriteArgumentsFromPageContext(args, writeTool, pageContext, input) {
    var _a, _b, _c, _d, _e;
    const entity = pageContext === null || pageContext === void 0 ? void 0 : pageContext.entity;
    if (!entity || typeof entity !== 'object') {
        return args;
    }
    const compactParams = (0, tool_decision_input_util_1.listToolInputCompactParams)(writeTool.inputSchema, writeTool.schema);
    const paths = resolveWriteToolSubmitPaths(writeTool);
    const next = JSON.parse(JSON.stringify(args));
    const paramLeafByPath = new Map(compactParams.map((row) => [
        row.name,
        lastPathSegment(row.name.replace(/\[\]/g, '')),
    ]));
    const businessFields = new Set((_b = (_a = (0, tool_agent_metadata_util_1.parseAgentMetadata)(writeTool.agentMetadata)) === null || _a === void 0 ? void 0 : _a.businessFields) !== null && _b !== void 0 ? _b : []);
    const readIdentifierByLeaf = (input === null || input === void 0 ? void 0 : input.observations) && input.isReadToolObservation
        ? collectReadIdentifierValuesByLeaf(input.observations, input.isReadToolObservation, paths.identifierLeaves, businessFields)
        : new Map();
    for (const row of compactParams) {
        const leaf = (_c = paramLeafByPath.get(row.name)) !== null && _c !== void 0 ? _c : '';
        const value = (_d = entity[row.name]) !== null && _d !== void 0 ? _d : entity[leaf];
        if (!isPresent(value) || isPresentAtWriteToolParamPath(next, row.name)) {
            continue;
        }
        if (!isPageContextValueCompatibleWithParam(value, row)) {
            continue;
        }
        setValueAtParamPath(next, row.name, value, paths.bodyRoot);
    }
    const entityId = typeof entity.id === 'string' ? entity.id.trim() : '';
    const missingIdentifierRequired = compactParams.filter((row) => {
        var _a;
        if (!row.required) {
            return false;
        }
        const leaf = (_a = paramLeafByPath.get(row.name)) !== null && _a !== void 0 ? _a : '';
        if (!paths.identifierLeaves.has(leaf)) {
            return false;
        }
        return !isPresentAtWriteToolParamPath(next, row.name);
    });
    for (const row of missingIdentifierRequired) {
        const leaf = (_e = paramLeafByPath.get(row.name)) !== null && _e !== void 0 ? _e : '';
        const fromRead = readIdentifierByLeaf.get(leaf);
        if (isPresent(fromRead) &&
            isPageContextValueCompatibleWithParam(fromRead, row)) {
            setValueAtParamPath(next, row.name, fromRead, paths.bodyRoot);
        }
    }
    if (!entityId) {
        return next;
    }
    const stillMissingIdentifierRequired = missingIdentifierRequired.filter((row) => !isPresentAtWriteToolParamPath(next, row.name));
    if (stillMissingIdentifierRequired.length === 1) {
        const row = stillMissingIdentifierRequired[0];
        if (isPageContextValueCompatibleWithParam(entityId, row)) {
            setValueAtParamPath(next, row.name, entityId, paths.bodyRoot);
        }
    }
    return next;
}
exports.enrichWriteArgumentsFromPageContext = enrichWriteArgumentsFromPageContext;
function normalizeWriteToolArguments(args, writeTool, observations, input) {
    const fromRead = enrichWriteToolArgumentsFromReadObservations(args, writeTool, observations, input);
    const fromSelf = enrichWriteArgumentsFromSelf(fromRead, writeTool);
    return enrichWriteArgumentsFromPageContext(fromSelf, writeTool, input.pageContext, {
        observations,
        isReadToolObservation: input.isReadToolObservation,
    });
}
exports.normalizeWriteToolArguments = normalizeWriteToolArguments;
function findMissingRequiredWriteToolArgPath(args, writeTool) {
    const compactParams = (0, tool_decision_input_util_1.listToolInputCompactParams)(writeTool.inputSchema, writeTool.schema);
    const requiredPaths = compactParams
        .filter((row) => row.required)
        .map((row) => row.name);
    if (requiredPaths.length === 0) {
        const compact = (0, tool_decision_input_util_1.buildCompactToolInput)(writeTool.inputSchema, writeTool.schema, writeTool.agentMetadata);
        for (const name of (0, tool_decision_input_util_1.listRequiredParamNames)(compact)) {
            if (!isPresent(args[name])) {
                return name;
            }
        }
        return null;
    }
    for (const path of requiredPaths) {
        if (!isPresentAtWriteToolParamPath(args, path)) {
            return path;
        }
    }
    return null;
}
exports.findMissingRequiredWriteToolArgPath = findMissingRequiredWriteToolArgPath;
function readValueAtWriteToolParamPath(args, path) {
    return readValueAtParamPath(args, path);
}
exports.readValueAtWriteToolParamPath = readValueAtWriteToolParamPath;
function resolvePrimaryWriteToolSubmitPath(writeTool) {
    const compactParams = (0, tool_decision_input_util_1.listToolInputCompactParams)(writeTool.inputSchema, writeTool.schema);
    return pickPrimaryWriteToolSubmitPath(resolveWriteToolSubmitPaths(writeTool), compactParams);
}
exports.resolvePrimaryWriteToolSubmitPath = resolvePrimaryWriteToolSubmitPath;
//# sourceMappingURL=write-tool-draft-injection.util.js.map