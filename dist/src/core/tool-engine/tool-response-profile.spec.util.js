"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAndNormalizeResponseProfile = exports.assertValidResponseProfile = exports.validateResponseProfile = exports.normalizeResponseProfile = exports.RESPONSE_PROFILE_ROOT_META_KEYS = exports.RESPONSE_PROFILE_LIST_PATH_CANDIDATES = void 0;
const common_1 = require("@nestjs/common");
const tool_output_projection_util_1 = require("./tool-output-projection.util");
exports.RESPONSE_PROFILE_LIST_PATH_CANDIDATES = [
    'data',
    'list',
    'records',
    'items',
    'data.list',
    'data.records',
];
exports.RESPONSE_PROFILE_ROOT_META_KEYS = [
    'total',
    'page',
    'pageSize',
    'pages',
    'size',
];
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
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
function listPathKey(listPath) {
    var _a;
    return (_a = listPath.split('.').filter(Boolean).pop()) !== null && _a !== void 0 ? _a : listPath;
}
function cloneField(field) {
    return Object.assign(Object.assign({}, field), { keywords: field.keywords ? [...field.keywords] : undefined, enumLabels: field.enumLabels ? Object.assign({}, field.enumLabels) : undefined });
}
function detectListPathFromSample(sampleData) {
    for (const candidate of exports.RESPONSE_PROFILE_LIST_PATH_CANDIDATES) {
        const value = getByPath(sampleData, candidate);
        if (Array.isArray(value)) {
            return candidate;
        }
    }
    return undefined;
}
function countListItemPrefixFields(fields, listPath) {
    const prefix = `${listPath}.`;
    return fields.filter((field) => field.path.startsWith(prefix)).length;
}
function inferListPath(profile, sampleData) {
    var _a, _b;
    const fromSample = sampleData ? detectListPathFromSample(sampleData) : undefined;
    const profileListPath = (_a = profile.listPath) === null || _a === void 0 ? void 0 : _a.trim();
    if (profileListPath && sampleData) {
        const listValue = getByPath(sampleData, profileListPath);
        if (Array.isArray(listValue)) {
            return profileListPath;
        }
    }
    else if (profileListPath && !sampleData) {
        return profileListPath;
    }
    if (fromSample) {
        return fromSample;
    }
    let bestPath;
    let bestCount = 0;
    for (const candidate of exports.RESPONSE_PROFILE_LIST_PATH_CANDIDATES) {
        const count = countListItemPrefixFields(profile.coreFields, candidate) +
            countListItemPrefixFields((_b = profile.optionalFields) !== null && _b !== void 0 ? _b : [], candidate);
        if (count > bestCount) {
            bestCount = count;
            bestPath = candidate;
        }
    }
    return bestCount > 0 ? bestPath : profileListPath || undefined;
}
function stripListPrefix(path, listPath) {
    if (path === listPath) {
        return null;
    }
    const prefix = `${listPath}.`;
    if (path.startsWith(prefix)) {
        return path.slice(prefix.length);
    }
    return path;
}
function isRootMetaPath(path, listPath) {
    if (path.startsWith(`${listPath}.`)) {
        return false;
    }
    return exports.RESPONSE_PROFILE_ROOT_META_KEYS.includes(path);
}
function dedupeFields(fields) {
    const seen = new Set();
    const result = [];
    for (const field of fields) {
        if (seen.has(field.path)) {
            continue;
        }
        seen.add(field.path);
        result.push(field);
    }
    return result;
}
function normalizeResponseProfile(profile, sampleData) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const adjustments = [];
    const listPath = inferListPath(profile, sampleData);
    if (!listPath) {
        return { profile, adjustments };
    }
    const itemCore = [];
    const itemOptional = [];
    const metaFields = [...((_a = profile.listMetaFields) !== null && _a !== void 0 ? _a : [])];
    const metaSeen = new Set(metaFields.map((field) => field.path));
    const classifyFields = (fields, target) => {
        for (const field of fields !== null && fields !== void 0 ? fields : []) {
            const stripped = stripListPrefix(field.path, listPath);
            if (stripped == null) {
                adjustments.push(`skip array container field: ${field.path}`);
                continue;
            }
            if (isRootMetaPath(field.path, listPath) &&
                !field.path.startsWith(`${listPath}.`)) {
                if (!metaSeen.has(field.path)) {
                    metaFields.push(cloneField(field));
                    metaSeen.add(field.path);
                    adjustments.push(`move root meta field: ${field.path}`);
                }
                continue;
            }
            if (field.path.startsWith(`${listPath}.`)) {
                target.push(Object.assign(Object.assign({}, cloneField(field)), { path: stripped }));
                adjustments.push(`rewrite item field: ${field.path} -> ${stripped}`);
                continue;
            }
            target.push(cloneField(field));
        }
    };
    classifyFields(profile.coreFields, itemCore);
    classifyFields(profile.optionalFields, itemOptional);
    for (const key of exports.RESPONSE_PROFILE_ROOT_META_KEYS) {
        if (metaSeen.has(key)) {
            continue;
        }
        if (sampleData && getByPath(sampleData, key) === undefined) {
            continue;
        }
        if (!sampleData) {
            continue;
        }
        metaFields.push({
            path: key,
            label: key,
            description: key,
        });
        metaSeen.add(key);
        adjustments.push(`auto add list meta field: ${key}`);
    }
    const listKey = listPathKey(listPath);
    const arrayLimits = Object.assign(Object.assign({}, ((_b = profile.arrayLimits) !== null && _b !== void 0 ? _b : {})), { [listKey]: (_h = (_f = (_d = (_c = profile.arrayLimits) === null || _c === void 0 ? void 0 : _c[listKey]) !== null && _d !== void 0 ? _d : (_e = profile.arrayLimits) === null || _e === void 0 ? void 0 : _e.list) !== null && _f !== void 0 ? _f : (_g = profile.arrayLimits) === null || _g === void 0 ? void 0 : _g.data) !== null && _h !== void 0 ? _h : 5 });
    return {
        profile: {
            coreFields: dedupeFields(itemCore),
            optionalFields: dedupeFields(itemOptional),
            listPath,
            listMetaFields: dedupeFields(metaFields),
            arrayLimits,
        },
        adjustments,
    };
}
exports.normalizeResponseProfile = normalizeResponseProfile;
function validateResponseProfile(profile, sampleData) {
    var _a, _b;
    const issues = [];
    if (profile.coreFields.length === 0) {
        issues.push({
            code: 'CORE_FIELDS_EMPTY',
            message: 'responseProfile.coreFields 不能为空',
        });
    }
    const listPath = (_a = profile.listPath) === null || _a === void 0 ? void 0 : _a.trim();
    if (listPath) {
        const prefix = `${listPath}.`;
        for (const field of profile.coreFields) {
            if (field.path.startsWith(prefix)) {
                issues.push({
                    code: 'LIST_ITEM_PATH_INVALID',
                    path: field.path,
                    message: `listPath=${listPath} 时 coreFields.path 应相对列表元素，不能写成 ${field.path}`,
                });
            }
            if (field.path === listPath) {
                issues.push({
                    code: 'LIST_CONTAINER_IN_CORE',
                    path: field.path,
                    message: `不能把列表容器 ${listPath} 放进 coreFields`,
                });
            }
        }
        for (const field of (_b = profile.optionalFields) !== null && _b !== void 0 ? _b : []) {
            if (field.path.startsWith(prefix)) {
                issues.push({
                    code: 'LIST_ITEM_PATH_INVALID',
                    path: field.path,
                    message: `listPath=${listPath} 时 optionalFields.path 应相对列表元素，不能写成 ${field.path}`,
                });
            }
        }
        if (sampleData) {
            const listValue = getByPath(sampleData, listPath);
            if (!Array.isArray(listValue)) {
                issues.push({
                    code: 'LIST_PATH_NOT_ARRAY',
                    message: `sample 中 ${listPath} 不是数组，不能设置 listPath=${listPath}`,
                });
            }
            else if (listValue.length > 0 && isRecord(listValue[0])) {
                const firstItem = listValue[0];
                const missingCore = profile.coreFields.filter((field) => getByPath(firstItem, field.path) === undefined);
                if (missingCore.length === profile.coreFields.length) {
                    issues.push({
                        code: 'CORE_FIELDS_NOT_IN_LIST_ITEM',
                        message: `coreFields 在 ${listPath}[0] 上全部缺失，请检查 path 规范`,
                    });
                }
            }
        }
    }
    else if (sampleData && detectListPathFromSample(sampleData)) {
        issues.push({
            code: 'LIST_PATH_REQUIRED',
            message: 'sample 是列表响应（如 data: []），必须设置 listPath，且 core/optional 路径相对列表元素',
        });
    }
    return issues;
}
exports.validateResponseProfile = validateResponseProfile;
function assertValidResponseProfile(profile, sampleData) {
    const normalized = normalizeResponseProfile(profile, sampleData);
    const issues = validateResponseProfile(normalized.profile, sampleData);
    if (issues.length > 0) {
        throw new common_1.BadRequestException({
            message: 'responseProfile 不符合规范',
            issues,
            adjustments: normalized.adjustments,
        });
    }
    return normalized.profile;
}
exports.assertValidResponseProfile = assertValidResponseProfile;
function parseAndNormalizeResponseProfile(raw, sampleData) {
    const parsed = (0, tool_output_projection_util_1.parseResponseProfile)(raw);
    if (!parsed) {
        return null;
    }
    return assertValidResponseProfile(parsed, sampleData);
}
exports.parseAndNormalizeResponseProfile = parseAndNormalizeResponseProfile;
//# sourceMappingURL=tool-response-profile.spec.util.js.map