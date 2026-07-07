"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveToolDefinitionKeyForCreate = exports.buildToolDefinitionKey = exports.legacyToolDefinitionKey = exports.normalizeDefinitionKey = exports.slugDefinitionKeyPath = exports.slugDefinitionKeySegment = void 0;
const DEFINITION_KEY_MAX_LEN = 128;
const DEFINITION_KEY_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;
function slugDefinitionKeySegment(value) {
    const slug = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    return slug || 'misc';
}
exports.slugDefinitionKeySegment = slugDefinitionKeySegment;
function slugDefinitionKeyPath(urlPath) {
    const normalized = urlPath.trim().replace(/^\/+/, '');
    if (!normalized) {
        return 'root';
    }
    return normalized
        .split('/')
        .filter(Boolean)
        .map((segment) => segment.replace(/^\{+|\}+$/g, ''))
        .map((segment) => slugDefinitionKeySegment(segment))
        .join('.');
}
exports.slugDefinitionKeyPath = slugDefinitionKeyPath;
function normalizeDefinitionKey(raw) {
    const key = raw
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '.')
        .replace(/\.{2,}/g, '.')
        .replace(/^\.+|\.+$/g, '');
    if (!key || !DEFINITION_KEY_PATTERN.test(key)) {
        throw new Error('definitionKey must match [a-z0-9][a-z0-9._-]* (max 128 chars)');
    }
    if (key.length > DEFINITION_KEY_MAX_LEN) {
        return key.slice(0, DEFINITION_KEY_MAX_LEN).replace(/[._-]+$/g, '');
    }
    return key;
}
exports.normalizeDefinitionKey = normalizeDefinitionKey;
function legacyToolDefinitionKey(toolId) {
    return `legacy_${toolId}`;
}
exports.legacyToolDefinitionKey = legacyToolDefinitionKey;
function buildToolDefinitionKey(input) {
    var _a, _b, _c;
    const tag = slugDefinitionKeySegment((_a = input.categoryLabel) !== null && _a !== void 0 ? _a : 'misc');
    const operationId = ((_b = input.operationId) === null || _b === void 0 ? void 0 : _b.trim()) || ((_c = input.name) === null || _c === void 0 ? void 0 : _c.trim());
    if (operationId) {
        return normalizeDefinitionKey(`${tag}.${slugDefinitionKeySegment(operationId)}`);
    }
    const method = String(input.method).toLowerCase();
    const pathPart = slugDefinitionKeyPath(input.path);
    return normalizeDefinitionKey(`${tag}.${method}.${pathPart}`);
}
exports.buildToolDefinitionKey = buildToolDefinitionKey;
function resolveToolDefinitionKeyForCreate(input) {
    var _a;
    if ((_a = input.definitionKey) === null || _a === void 0 ? void 0 : _a.trim()) {
        return normalizeDefinitionKey(input.definitionKey);
    }
    return buildToolDefinitionKey({
        method: input.method,
        path: input.path,
        name: input.name,
        categoryLabel: input.categoryLabel,
    });
}
exports.resolveToolDefinitionKeyForCreate = resolveToolDefinitionKeyForCreate;
//# sourceMappingURL=tool-definition-key.util.js.map