"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDraftReviewMaxRetries = void 0;
function resolveDraftReviewMaxRetries() {
    var _a;
    const raw = (_a = process.env.DRAFT_REVIEW_MAX_RETRIES) === null || _a === void 0 ? void 0 : _a.trim();
    if (!raw || raw.toLowerCase() === 'unlimited') {
        return null;
    }
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return null;
    }
    return parsed;
}
exports.resolveDraftReviewMaxRetries = resolveDraftReviewMaxRetries;
//# sourceMappingURL=draft-review-config.util.js.map