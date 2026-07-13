"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatFieldLabelsForPrompt = exports.projectToolOutput = exports.parseResponseProfile = void 0;
const tool_decision_role_enum_1 = require("./tool-decision-role.enum");
const tool_pagination_params_util_1 = require("./tool-pagination-params.util");
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function normalizeQuestion(text) {
    return text.trim().toLowerCase();
}
function fieldMatchesQuestion(field, userQuestion) {
    var _a;
    const normalized = normalizeQuestion(userQuestion);
    if (!normalized) {
        return false;
    }
    return ((_a = field.keywords) !== null && _a !== void 0 ? _a : []).some((keyword) => normalized.includes(keyword.trim().toLowerCase()));
}
function getByPath(root, path) {
    if (!path.trim()) {
        return root;
    }
    return walkPathSegments(root, path.split('.').filter(Boolean), 0);
}
function walkPathSegments(current, segments, index) {
    if (index >= segments.length) {
        return current;
    }
    if (current == null) {
        return undefined;
    }
    if (Array.isArray(current)) {
        const mapped = current
            .map((item) => walkPathSegments(item, segments, index))
            .filter((item) => item !== undefined);
        return mapped.length > 0 ? mapped : undefined;
    }
    if (!isRecord(current)) {
        return undefined;
    }
    return walkPathSegments(current[segments[index]], segments, index + 1);
}
function setByPath(root, path, value) {
    const segments = path.split('.').filter(Boolean);
    if (segments.length === 0) {
        return;
    }
    let current = root;
    for (let index = 0; index < segments.length - 1; index += 1) {
        const segment = segments[index];
        const next = current[segment];
        if (!isRecord(next)) {
            const created = {};
            current[segment] = created;
            current = created;
            continue;
        }
        current = next;
    }
    current[segments[segments.length - 1]] = value;
}
function applyEnumLabel(value, enumLabels) {
    var _a;
    if (!enumLabels || value === null || value === undefined) {
        return value;
    }
    const key = String(value);
    return (_a = enumLabels[key]) !== null && _a !== void 0 ? _a : value;
}
function limitArray(value, limit) {
    if (!Array.isArray(value)) {
        return value;
    }
    return value.slice(0, Math.max(1, limit));
}
function resolveArrayLimit(path, arrayLimits) {
    var _a, _b, _c;
    const segments = path.split('.').filter(Boolean);
    const lastSegment = (_a = segments[segments.length - 1]) !== null && _a !== void 0 ? _a : path;
    const explicit = (_c = (_b = arrayLimits[path]) !== null && _b !== void 0 ? _b : arrayLimits[lastSegment]) !== null && _c !== void 0 ? _c : (segments.length > 1 ? arrayLimits[segments[0]] : undefined);
    return (0, tool_pagination_params_util_1.resolveEffectiveArrayLimit)(explicit);
}
function applyFieldValue(field, rawValue, arrayLimits) {
    const limit = resolveArrayLimit(field.path, arrayLimits);
    let value = rawValue;
    if (Array.isArray(value)) {
        value = limitArray(value, limit);
    }
    return applyEnumLabel(value, field.enumLabels);
}
function pickScalarOrNestedObjectFields(source, fields, arrayLimits, result) {
    for (const field of fields) {
        const rawValue = getByPath(source, field.path);
        if (rawValue === undefined) {
            continue;
        }
        setByPath(result, field.path, applyFieldValue(field, rawValue, arrayLimits));
    }
}
function pickFieldsOnObject(source, fields, arrayLimits) {
    var _a, _b, _c;
    if (!isRecord(source)) {
        return {};
    }
    const scalarFields = [];
    const arrayFieldGroups = new Map();
    for (const field of fields) {
        const segments = field.path.split('.').filter(Boolean);
        if (segments.length <= 1) {
            scalarFields.push(field);
            continue;
        }
        const headKey = segments[0];
        const headValue = source[headKey];
        if (Array.isArray(headValue)) {
            const group = (_a = arrayFieldGroups.get(headKey)) !== null && _a !== void 0 ? _a : [];
            group.push(field);
            arrayFieldGroups.set(headKey, group);
            continue;
        }
        scalarFields.push(field);
    }
    const result = {};
    pickScalarOrNestedObjectFields(source, scalarFields, arrayLimits, result);
    for (const [arrayKey, groupFields] of arrayFieldGroups) {
        const rows = source[arrayKey];
        if (!Array.isArray(rows)) {
            continue;
        }
        const limit = (0, tool_pagination_params_util_1.resolveEffectiveArrayLimit)((_c = (_b = arrayLimits[arrayKey]) !== null && _b !== void 0 ? _b : arrayLimits.list) !== null && _c !== void 0 ? _c : arrayLimits.data);
        const sliced = rows.slice(0, Math.max(1, limit));
        const prefix = `${arrayKey}.`;
        result[arrayKey] = sliced.map((row) => {
            const relativeFields = groupFields.map((field) => (Object.assign(Object.assign({}, field), { path: field.path.startsWith(prefix)
                    ? field.path.slice(prefix.length)
                    : field.path })));
            return pickFieldsOnObject(row, relativeFields, arrayLimits);
        });
    }
    return result;
}
function collectSelectedFields(profile, userQuestion) {
    var _a;
    const selected = [...profile.coreFields];
    const seen = new Set(selected.map((field) => field.path));
    for (const field of (_a = profile.optionalFields) !== null && _a !== void 0 ? _a : []) {
        if (seen.has(field.path)) {
            continue;
        }
        if (fieldMatchesQuestion(field, userQuestion)) {
            selected.push(field);
            seen.add(field.path);
        }
    }
    return selected;
}
function buildFieldMetadata(fields) {
    var _a;
    const fieldLabels = {};
    const fieldDescriptions = {};
    const enumLabelsByPath = {};
    for (const field of fields) {
        fieldLabels[field.path] = field.label;
        if ((_a = field.description) === null || _a === void 0 ? void 0 : _a.trim()) {
            fieldDescriptions[field.path] = field.description.trim();
        }
        if (field.enumLabels && Object.keys(field.enumLabels).length > 0) {
            enumLabelsByPath[field.path] = field.enumLabels;
        }
    }
    return { fieldLabels, fieldDescriptions, enumLabelsByPath };
}
function parseResponseProfile(raw) {
    if (!isRecord(raw)) {
        return null;
    }
    const coreFieldsRaw = raw.coreFields;
    if (!Array.isArray(coreFieldsRaw) || coreFieldsRaw.length === 0) {
        return null;
    }
    const normalizeField = (item) => {
        if (!isRecord(item)) {
            return null;
        }
        const path = typeof item.path === 'string' ? item.path.trim() : '';
        const label = typeof item.label === 'string' ? item.label.trim() : '';
        if (!path || !label) {
            return null;
        }
        const keywords = Array.isArray(item.keywords)
            ? item.keywords.filter((kw) => typeof kw === 'string')
            : undefined;
        const enumLabels = isRecord(item.enumLabels)
            ? Object.fromEntries(Object.entries(item.enumLabels).filter((entry) => typeof entry[1] === 'string'))
            : undefined;
        const description = typeof item.description === 'string' ? item.description.trim() : undefined;
        return {
            path,
            label,
            description: description || undefined,
            keywords,
            enumLabels: enumLabels && Object.keys(enumLabels).length > 0
                ? enumLabels
                : undefined,
        };
    };
    const coreFields = coreFieldsRaw
        .map(normalizeField)
        .filter((field) => field != null);
    if (coreFields.length === 0) {
        return null;
    }
    const optionalFields = Array.isArray(raw.optionalFields)
        ? raw.optionalFields
            .map(normalizeField)
            .filter((field) => field != null)
        : undefined;
    const arrayLimits = isRecord(raw.arrayLimits)
        ? Object.fromEntries(Object.entries(raw.arrayLimits).filter((entry) => typeof entry[1] === 'number'))
        : undefined;
    const listPath = typeof raw.listPath === 'string' && raw.listPath.trim()
        ? raw.listPath.trim()
        : undefined;
    const listMetaFields = Array.isArray(raw.listMetaFields)
        ? raw.listMetaFields
            .map(normalizeField)
            .filter((field) => field != null)
        : undefined;
    const decisionRole = (0, tool_decision_role_enum_1.parseConfiguredToolDecisionRole)(raw.decisionRole);
    return {
        coreFields,
        optionalFields,
        arrayLimits,
        listPath,
        listMetaFields,
        decisionRole,
    };
}
exports.parseResponseProfile = parseResponseProfile;
function projectToolOutput(raw, userQuestion, profile) {
    var _a, _b, _c, _d, _e, _f;
    const passthrough = {
        data: raw,
        fieldLabels: {},
        fieldDescriptions: {},
        enumLabelsByPath: {},
    };
    if (isRecord(raw) &&
        typeof raw.code === 'string' &&
        typeof raw.userHint === 'string') {
        return passthrough;
    }
    if (!profile) {
        return passthrough;
    }
    const arrayLimits = (_a = profile.arrayLimits) !== null && _a !== void 0 ? _a : {};
    const selectedFields = collectSelectedFields(profile, userQuestion);
    const { fieldLabels, fieldDescriptions, enumLabelsByPath } = buildFieldMetadata(selectedFields);
    if (profile.listPath) {
        const listValue = getByPath(raw, profile.listPath);
        const listLimit = (0, tool_pagination_params_util_1.resolveEffectiveArrayLimit)((_d = (_c = arrayLimits[(_b = profile.listPath.split('.').pop()) !== null && _b !== void 0 ? _b : profile.listPath]) !== null && _c !== void 0 ? _c : arrayLimits.list) !== null && _d !== void 0 ? _d : arrayLimits.data);
        const sourceRows = Array.isArray(listValue) ? listValue : [];
        const rows = sourceRows.slice(0, Math.max(1, listLimit));
        const projectedRows = rows.map((row) => pickFieldsOnObject(row, selectedFields, arrayLimits));
        const container = {};
        setByPath(container, profile.listPath, projectedRows);
        for (const metaField of (_e = profile.listMetaFields) !== null && _e !== void 0 ? _e : []) {
            const metaValue = getByPath(raw, metaField.path);
            if (metaValue !== undefined) {
                const projectedMeta = applyEnumLabel(metaValue, metaField.enumLabels);
                setByPath(container, metaField.path, projectedMeta);
                fieldLabels[metaField.path] = metaField.label;
                if ((_f = metaField.description) === null || _f === void 0 ? void 0 : _f.trim()) {
                    fieldDescriptions[metaField.path] = metaField.description.trim();
                }
                if (metaField.enumLabels) {
                    enumLabelsByPath[metaField.path] = metaField.enumLabels;
                }
            }
        }
        return {
            data: container,
            fieldLabels,
            fieldDescriptions,
            enumLabelsByPath,
        };
    }
    const data = pickFieldsOnObject(raw, selectedFields, arrayLimits);
    return { data, fieldLabels, fieldDescriptions, enumLabelsByPath };
}
exports.projectToolOutput = projectToolOutput;
function formatFieldLabelsForPrompt(fieldLabels, enumLabelsByPath, fieldDescriptions = {}) {
    const lines = Object.entries(fieldLabels).map(([path, label]) => {
        const description = fieldDescriptions[path];
        const enumLabels = enumLabelsByPath[path];
        const labelPart = description && description !== label
            ? `${label}：${description}`
            : label;
        if (!enumLabels) {
            return `- ${path}: ${labelPart}`;
        }
        const enumText = Object.entries(enumLabels)
            .map(([value, text]) => `${value}=${text}`)
            .join(', ');
        return `- ${path}: ${labelPart}（${enumText}）`;
    });
    return lines.join('\n');
}
exports.formatFieldLabelsForPrompt = formatFieldLabelsForPrompt;
//# sourceMappingURL=tool-output-projection.util.js.map