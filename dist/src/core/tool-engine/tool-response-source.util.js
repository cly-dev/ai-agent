"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveToolResponseSource = exports.extractRawInvokeError = exports.buildHttpResponseSource = exports.ToolHttpResponseError = void 0;
class ToolHttpResponseError extends Error {
    constructor(message, httpResponse) {
        super(message);
        this.name = 'ToolHttpResponseError';
        this.httpResponse = httpResponse;
    }
}
exports.ToolHttpResponseError = ToolHttpResponseError;
function buildHttpResponseSource(response, bodyText, bodyParsed) {
    return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        bodyText,
        bodyParsed,
    };
}
exports.buildHttpResponseSource = buildHttpResponseSource;
function extractRawInvokeError(error) {
    if (error instanceof ToolHttpResponseError) {
        return error.httpResponse.bodyText;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return error;
}
exports.extractRawInvokeError = extractRawInvokeError;
function resolveToolResponseSource(input) {
    if (input.toolResult.responseSource !== undefined) {
        return input.toolResult.responseSource;
    }
    if (input.toolResult.httpResponse) {
        return input.toolResult.httpResponse.bodyText;
    }
    return undefined;
}
exports.resolveToolResponseSource = resolveToolResponseSource;
//# sourceMappingURL=tool-response-source.util.js.map