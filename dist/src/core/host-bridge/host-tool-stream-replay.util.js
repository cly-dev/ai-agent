"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldReplayHostAction = void 0;
const host_tool_stream_types_1 = require("./host-tool-stream.types");
function shouldReplayHostAction(payload) {
    if ((0, host_tool_stream_types_1.isHostActionBatchPayload)(payload)) {
        return payload.hostTools.length > 0;
    }
    if ((0, host_tool_stream_types_1.isHostActionStreamPayload)(payload)) {
        return payload.stream.mode === 'full';
    }
    return false;
}
exports.shouldReplayHostAction = shouldReplayHostAction;
//# sourceMappingURL=host-tool-stream-replay.util.js.map