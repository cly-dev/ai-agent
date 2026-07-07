"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertNoLockedFieldChanges = exports.sanitizeDraftReviewArgumentsPatch = exports.isSubmitPathInjectionScope = exports.DraftReviewPolicyViolationError = void 0;
const write_tool_draft_injection_util_1 = require("../tool-engine/write-tool-draft-injection.util");
class DraftReviewPolicyViolationError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'DraftReviewPolicyViolationError';
    }
}
exports.DraftReviewPolicyViolationError = DraftReviewPolicyViolationError;
function valuesEqual(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}
function isSubmitPathInjectionScope(fieldPath, submitPath) {
    if (fieldPath === submitPath) {
        return true;
    }
    return (submitPath.startsWith(`${fieldPath}[].`) ||
        submitPath.startsWith(`${fieldPath}.`));
}
exports.isSubmitPathInjectionScope = isSubmitPathInjectionScope;
function sanitizeDraftReviewArgumentsPatch(patch, policy) {
    if (!policy.allowArgumentsPatch) {
        return {};
    }
    const editablePaths = new Set(policy.fields.filter((field) => field.editable).map((field) => field.path));
    const sanitized = {};
    for (const [key, value] of Object.entries(patch)) {
        if (!editablePaths.has(key)) {
            continue;
        }
        sanitized[key] = value;
    }
    return sanitized;
}
exports.sanitizeDraftReviewArgumentsPatch = sanitizeDraftReviewArgumentsPatch;
function assertNoLockedFieldChanges(input) {
    var _a;
    const submitPath = ((_a = input.policy.submitPath) === null || _a === void 0 ? void 0 : _a.trim()) || null;
    for (const field of input.policy.fields) {
        if (field.editable) {
            continue;
        }
        if (submitPath && isSubmitPathInjectionScope(field.path, submitPath)) {
            continue;
        }
        const beforeValue = (0, write_tool_draft_injection_util_1.readValueAtWriteToolParamPath)(input.before, field.path);
        const afterValue = (0, write_tool_draft_injection_util_1.readValueAtWriteToolParamPath)(input.after, field.path);
        if (!valuesEqual(beforeValue, afterValue)) {
            throw new DraftReviewPolicyViolationError('EDITED_LOCKED_FIELD', `locked field changed: ${field.path}`);
        }
    }
}
exports.assertNoLockedFieldChanges = assertNoLockedFieldChanges;
//# sourceMappingURL=sanitize-draft-review-patch.util.js.map