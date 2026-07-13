"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchHostActionSse = void 0;
const host_tool_stream_types_1 = require("./host-tool-stream.types");
function dispatchHostActionSse(publish, sessionId, payload) {
    var _a, _b;
    if ((0, host_tool_stream_types_1.isHostActionBatchPayload)(payload) && !payload.hostTools.length) {
        return;
    }
    if ((0, host_tool_stream_types_1.isHostActionStreamPayload)(payload) &&
        payload.stream.mode === 'full' &&
        !((_b = (_a = payload.hostTools) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0)) {
        return;
    }
    publish(sessionId, { event: 'host_action', payload });
}
exports.dispatchHostActionSse = dispatchHostActionSse;
//# sourceMappingURL=host-action-dispatch.util.js.map