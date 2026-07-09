"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assessWriteToolBusinessFailure = void 0;
function readNestedMessage(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }
    const row = value;
    if (typeof row.message === 'string' && row.message.trim()) {
        return row.message.trim();
    }
    if (typeof row.msg === 'string' && row.msg.trim()) {
        return row.msg.trim();
    }
    return null;
}
function assessWriteToolBusinessFailure(output) {
    var _a, _b;
    if (!output || typeof output !== 'object' || Array.isArray(output)) {
        return null;
    }
    const row = output;
    const httpCode = typeof row.httpCode === 'number'
        ? row.httpCode
        : typeof row.httpStatus === 'number'
            ? row.httpStatus
            : null;
    const nestedError = row.error;
    const nestedMessage = readNestedMessage(nestedError);
    const topLevelMessage = typeof row.message === 'string' && row.message.trim()
        ? row.message.trim()
        : null;
    if (row.success === false) {
        return {
            code: 'WRITE_FAILED',
            message: (_a = nestedMessage !== null && nestedMessage !== void 0 ? nestedMessage : topLevelMessage) !== null && _a !== void 0 ? _a : (httpCode != null ? `Write API returned httpCode ${httpCode}` : 'Write API returned success=false'),
        };
    }
    if (httpCode != null && httpCode >= 400) {
        return {
            code: 'WRITE_FAILED',
            message: (_b = nestedMessage !== null && nestedMessage !== void 0 ? nestedMessage : topLevelMessage) !== null && _b !== void 0 ? _b : `Write API returned httpCode ${httpCode}`,
        };
    }
    return null;
}
exports.assessWriteToolBusinessFailure = assessWriteToolBusinessFailure;
//# sourceMappingURL=write-tool-outcome.util.js.map