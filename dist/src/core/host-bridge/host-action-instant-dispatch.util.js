"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchHostActionInstant = void 0;
const host_tool_stream_session_util_1 = require("./host-tool-stream-session.util");
const host_tool_stream_target_util_1 = require("./host-tool-stream-target.util");
function dispatchHostActionInstant(publish, sessionId, input) {
    var _a, _b, _c;
    if (input.hostTools.length === 0) {
        return null;
    }
    const streamId = (_a = input.streamId) !== null && _a !== void 0 ? _a : (0, host_tool_stream_target_util_1.buildHostToolStreamId)({
        runId: input.runId,
        turnId: input.turnId,
        stepId: ((_b = input.planStepId) === null || _b === void 0 ? void 0 : _b.trim()) || 'dispatch',
    });
    const session = new host_tool_stream_session_util_1.HostToolStreamSession({
        publish,
        sessionId,
        pageContext: (_c = input.pageContext) !== null && _c !== void 0 ? _c : {},
        runId: input.runId,
        turnId: input.turnId,
        planStepId: input.planStepId,
        reason: input.reason,
        generation: input.generation,
    });
    return session.dispatchInstant({
        streamId,
        hostTools: input.hostTools,
        reason: input.reason,
    });
}
exports.dispatchHostActionInstant = dispatchHostActionInstant;
//# sourceMappingURL=host-action-instant-dispatch.util.js.map