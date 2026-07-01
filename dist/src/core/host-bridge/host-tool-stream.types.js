"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isHostActionBatchPayload = exports.isHostActionStreamPayload = exports.HOST_TOOL_STREAM_PROTOCOL_VERSION = void 0;
exports.HOST_TOOL_STREAM_PROTOCOL_VERSION = 1;
function isHostActionStreamPayload(payload) {
    return ('stream' in payload &&
        payload.stream != null &&
        typeof payload.stream.mode === 'string');
}
exports.isHostActionStreamPayload = isHostActionStreamPayload;
function isHostActionBatchPayload(payload) {
    return !isHostActionStreamPayload(payload);
}
exports.isHostActionBatchPayload = isHostActionBatchPayload;
//# sourceMappingURL=host-tool-stream.types.js.map