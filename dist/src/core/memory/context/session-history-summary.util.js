"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatSessionMemoryForCompression = exports.isSessionHistorySummaryAcceptable = void 0;
const session_goa_projection_util_1 = require("../goa/session-goa-projection.util");
const REJECT_PATTERNS = [
    /redacted_thinking/i,
    /<\s*think\s*>/i,
    /<\s*\/\s*think\s*>/i,
];
function isSessionHistorySummaryAcceptable(summary) {
    const text = summary.trim();
    if (!text) {
        return false;
    }
    if (text.length < 8) {
        return false;
    }
    return !REJECT_PATTERNS.some((pattern) => pattern.test(text));
}
exports.isSessionHistorySummaryAcceptable = isSessionHistorySummaryAcceptable;
function formatSessionMemoryForCompression(goa) {
    const block = (0, session_goa_projection_util_1.formatGoaForHistoryCompression)(goa).trim();
    return block.length > 0 ? block : null;
}
exports.formatSessionMemoryForCompression = formatSessionMemoryForCompression;
//# sourceMappingURL=session-history-summary.util.js.map