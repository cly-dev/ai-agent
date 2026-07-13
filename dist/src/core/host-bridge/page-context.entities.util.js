"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveEffectivePageContext = exports.coalescePageContext = void 0;
const parse_page_context_util_1 = require("./parse-page-context.util");
function normalizePageContext(source) {
    if (!source) {
        return null;
    }
    return (0, parse_page_context_util_1.parsePageContextFromMessageFields)({ pageContext: source });
}
function coalescePageContext(...sources) {
    for (const source of sources) {
        const normalized = normalizePageContext(source);
        if (normalized) {
            return normalized;
        }
    }
    return null;
}
exports.coalescePageContext = coalescePageContext;
function resolveEffectivePageContext(incoming, stored) {
    return coalescePageContext(incoming, stored);
}
exports.resolveEffectivePageContext = resolveEffectivePageContext;
//# sourceMappingURL=page-context.entities.util.js.map