"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeBusinessFieldsForPersist = exports.normalizeDraftReviewPolicyForPersist = exports.DraftReviewPolicyConfigError = void 0;
const tool_decision_input_util_1 = require("./tool-decision-input.util");
const tool_param_path_alias_util_1 = require("./tool-param-path-alias.util");
class DraftReviewPolicyConfigError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'DraftReviewPolicyConfigError';
    }
}
exports.DraftReviewPolicyConfigError = DraftReviewPolicyConfigError;
function assertPathsExistInSchema(paths, paramPaths, field) {
    for (const path of paths) {
        if (!paramPaths.has(path)) {
            const suggestion = (0, tool_param_path_alias_util_1.suggestArrayItemParamPathAlias)(path, paramPaths);
            throw new DraftReviewPolicyConfigError('DRAFT_REVIEW_PATH_NOT_IN_SCHEMA', suggestion
                ? `draftReview.${field} contains unknown param path: ${path}; use "${suggestion}" (array segments require [] in compact path)`
                : `draftReview.${field} contains unknown param path: ${path}`);
        }
    }
}
function normalizeFieldOverrides(overrides, paramPaths) {
    if (!(overrides === null || overrides === void 0 ? void 0 : overrides.length)) {
        return undefined;
    }
    return overrides.map((row) => (Object.assign(Object.assign({}, row), { path: (0, tool_param_path_alias_util_1.resolveArrayItemParamPathAlias)(row.path, paramPaths) })));
}
function normalizeDraftReviewPolicyForPersist(policy, inputSchema, fallbackSchema) {
    var _a, _b, _c;
    const editMode = (_a = policy.editMode) !== null && _a !== void 0 ? _a : 'preview_only';
    const paramPaths = new Set((0, tool_decision_input_util_1.listToolInputCompactParams)(inputSchema, fallbackSchema).map((row) => row.name));
    const submitPath = policy.submitPath
        ? (0, tool_param_path_alias_util_1.resolveArrayItemParamPathAlias)(policy.submitPath, paramPaths)
        : undefined;
    if (policy.submitPath && !paramPaths.has(submitPath)) {
        const suggestion = (0, tool_param_path_alias_util_1.suggestArrayItemParamPathAlias)(policy.submitPath, paramPaths);
        throw new DraftReviewPolicyConfigError('DRAFT_REVIEW_SUBMIT_PATH_INVALID', suggestion
            ? `draftReview.submitPath "${policy.submitPath}" not found; use "${suggestion}" (array segments require [] in compact path)`
            : `draftReview.submitPath "${policy.submitPath}" not found in tool inputSchema`);
    }
    if (editMode === 'preview_only' && policy.allowArgumentsPatch === true) {
        throw new DraftReviewPolicyConfigError('DRAFT_REVIEW_CONFIG_CONFLICT', 'draftReview.allowArgumentsPatch cannot be true when editMode is preview_only; use editMode allowlisted_fields with editablePaths instead');
    }
    const editablePaths = (0, tool_param_path_alias_util_1.normalizeParamPathListAliases)((_b = policy.editablePaths) !== null && _b !== void 0 ? _b : [], paramPaths);
    const lockedPaths = (0, tool_param_path_alias_util_1.normalizeParamPathListAliases)((_c = policy.lockedPaths) !== null && _c !== void 0 ? _c : [], paramPaths);
    const fieldOverrides = normalizeFieldOverrides(policy.fieldOverrides, paramPaths);
    const overridePaths = (fieldOverrides !== null && fieldOverrides !== void 0 ? fieldOverrides : []).map((row) => row.path);
    if (editMode === 'allowlisted_fields' && editablePaths.length === 0) {
        throw new DraftReviewPolicyConfigError('DRAFT_REVIEW_EDITABLE_PATHS_REQUIRED', 'draftReview.editablePaths is required when editMode is allowlisted_fields');
    }
    assertPathsExistInSchema(editablePaths, paramPaths, 'editablePaths');
    assertPathsExistInSchema(lockedPaths, paramPaths, 'lockedPaths');
    assertPathsExistInSchema(overridePaths, paramPaths, 'fieldOverrides');
    const normalized = Object.assign(Object.assign(Object.assign(Object.assign({ editMode }, (submitPath ? { submitPath } : {})), (editablePaths.length > 0 ? { editablePaths } : {})), (lockedPaths.length > 0 ? { lockedPaths } : {})), ((fieldOverrides === null || fieldOverrides === void 0 ? void 0 : fieldOverrides.length) ? { fieldOverrides } : {}));
    if (editMode !== 'preview_only' && policy.allowArgumentsPatch !== undefined) {
        normalized.allowArgumentsPatch = policy.allowArgumentsPatch;
    }
    return normalized;
}
exports.normalizeDraftReviewPolicyForPersist = normalizeDraftReviewPolicyForPersist;
function normalizeBusinessFieldsForPersist(businessFields, inputSchema, fallbackSchema) {
    const paramPaths = new Set((0, tool_decision_input_util_1.listToolInputCompactParams)(inputSchema, fallbackSchema).map((row) => row.name));
    return (0, tool_param_path_alias_util_1.normalizeParamPathListAliases)(businessFields, paramPaths);
}
exports.normalizeBusinessFieldsForPersist = normalizeBusinessFieldsForPersist;
//# sourceMappingURL=draft-review-policy-normalize.util.js.map