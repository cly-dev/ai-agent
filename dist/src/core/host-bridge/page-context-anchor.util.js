"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canDispatchHostAction = exports.resolveHostToolPageScope = exports.assessPageContextAnchor = void 0;
const page_context_usage_util_1 = require("./page-context-usage.util");
function pickString(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function assessPageContextAnchor(pageContext) {
    if (!pageContext) {
        return {
            page: null,
            routePath: null,
            entityId: null,
            entityType: null,
        };
    }
    const assessment = (0, page_context_usage_util_1.assessPageContextData)(pageContext);
    return {
        page: assessment.page,
        routePath: pickString(pageContext.routePath),
        entityId: assessment.entityId,
        entityType: assessment.entityType,
    };
}
exports.assessPageContextAnchor = assessPageContextAnchor;
function resolveHostToolPageScope(pageContext) {
    const anchor = assessPageContextAnchor(pageContext);
    if (anchor.page) {
        return anchor.page;
    }
    if (anchor.routePath && anchor.routePath !== '/') {
        return anchor.routePath;
    }
    return null;
}
exports.resolveHostToolPageScope = resolveHostToolPageScope;
function canDispatchHostAction(input) {
    if (resolveHostToolPageScope(input.pageContext) != null) {
        return true;
    }
    if (input.hostPageScopes.length === 0) {
        return false;
    }
    return input.hostPageScopes.every((scope) => scope == null || String(scope).trim() === '');
}
exports.canDispatchHostAction = canDispatchHostAction;
//# sourceMappingURL=page-context-anchor.util.js.map