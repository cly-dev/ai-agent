"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDraftRetryCountAfterRegeneration = exports.canRequestDraftRetry = exports.resolveDraftRetryBudget = void 0;
const draft_review_config_util_1 = require("./draft-review-config.util");
function resolveDraftRetryBudget(draftRetryCount) {
    const used = Math.max(0, draftRetryCount !== null && draftRetryCount !== void 0 ? draftRetryCount : 0);
    const max = (0, draft_review_config_util_1.resolveDraftReviewMaxRetries)();
    const remaining = Math.max(0, max - used);
    return {
        used,
        max,
        remaining,
        canRetry: remaining > 0,
    };
}
exports.resolveDraftRetryBudget = resolveDraftRetryBudget;
function canRequestDraftRetry(draftRetryCount) {
    return resolveDraftRetryBudget(draftRetryCount).canRetry;
}
exports.canRequestDraftRetry = canRequestDraftRetry;
function resolveDraftRetryCountAfterRegeneration(input) {
    var _a;
    const base = Math.max(0, (_a = input.previousCount) !== null && _a !== void 0 ? _a : 0);
    if (!input.regeneratedFromRetry) {
        return base;
    }
    return base + 1;
}
exports.resolveDraftRetryCountAfterRegeneration = resolveDraftRetryCountAfterRegeneration;
//# sourceMappingURL=draft-review-retry-limit.util.js.map